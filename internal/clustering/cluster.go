package clustering

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"sync"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

// StateType represents different types of state that can be synchronized
type StateType string

const (
	StateBackend     StateType = "backend"
	StateRoute       StateType = "route"
	StateConfig      StateType = "config"
)

// ClusterRole represents the role of a node in the cluster
type ClusterRole string

const (
	RoleLeader   ClusterRole = "leader"
	RoleFollower ClusterRole = "follower"
)

// ClusterEvent represents an event that occurred in the cluster
type ClusterEvent struct {
	Type      string      `json:"type"`
	Timestamp time.Time   `json:"timestamp"`
	NodeID    string      `json:"node_id"`
	Payload   interface{} `json:"payload"`
}

// ClusterNode represents a node in the cluster
type ClusterNode struct {
	ID        string     `json:"id"`
	Address   string     `json:"address"`
	Role      ClusterRole `json:"role"`
	LastSeen  time.Time  `json:"last_seen"`
	IsHealthy bool       `json:"is_healthy"`
}

// ClusterConfig contains the configuration for clustering
type ClusterConfig struct {
	Enabled        bool          `yaml:"enabled"`
	RedisAddress   string        `yaml:"redis_address"`
	RedisPassword  string        `yaml:"redis_password"`
	RedisDB        int           `yaml:"redis_db"`
	NodeID         string        `yaml:"node_id"`
	HeartbeatInterval time.Duration `yaml:"heartbeat_interval"`
	LeaderTimeout  time.Duration `yaml:"leader_timeout"`
}

// Cluster handles cluster state synchronization and leader election
type Cluster struct {
	config         *ClusterConfig
	nodeID         string
	role           ClusterRole
	client         *redis.Client
	logger         *zap.Logger
	pubsub         *redis.PubSub
	nodes          map[string]*ClusterNode
	nodesMutex     sync.RWMutex
	stateListeners map[StateType][]StateChangeListener
	listenersMutex sync.RWMutex
	ctx            context.Context
	cancel         context.CancelFunc
}

// StateChangeListener is called when state changes are received
type StateChangeListener func(stateType StateType, key string, value []byte)

// New creates a new cluster manager
func New(config *ClusterConfig, logger *zap.Logger) (*Cluster, error) {
	if !config.Enabled {
		logger.Info("Clustering is disabled")
		return nil, nil
	}

	// Generate node ID if not provided
	nodeID := config.NodeID
	if nodeID == "" {
		hostname, err := os.Hostname()
		if err != nil {
			hostname = "unknown"
		}
		nodeID = fmt.Sprintf("%s-%s", hostname, uuid.New().String()[:8])
	}

	// Set defaults
	if config.HeartbeatInterval == 0 {
		config.HeartbeatInterval = 5 * time.Second
	}
	if config.LeaderTimeout == 0 {
		config.LeaderTimeout = 15 * time.Second
	}

	client := redis.NewClient(&redis.Options{
		Addr:     config.RedisAddress,
		Password: config.RedisPassword,
		DB:       config.RedisDB,
	})

	ctx, cancel := context.WithCancel(context.Background())

	cluster := &Cluster{
		config:         config,
		nodeID:         nodeID,
		role:           RoleFollower, // Start as follower
		client:         client,
		logger:         logger,
		nodes:          make(map[string]*ClusterNode),
		stateListeners: make(map[StateType][]StateChangeListener),
		ctx:            ctx,
		cancel:         cancel,
	}

	return cluster, nil
}

// Start begins cluster operations
func (c *Cluster) Start(ctx context.Context) error {
	if c == nil {
		return nil // Clustering is disabled
	}

	// Test Redis connection
	if _, err := c.client.Ping(ctx).Result(); err != nil {
		return fmt.Errorf("failed to connect to Redis: %w", err)
	}

	// Register this node
	node := &ClusterNode{
		ID:        c.nodeID,
		Address:   "",  // Will be filled by caller
		Role:      RoleFollower,
		LastSeen:  time.Now(),
		IsHealthy: true,
	}

	// Subscribe to cluster events
	c.pubsub = c.client.Subscribe(ctx, "veloflux:events")
	
	// Start background goroutines
	go c.heartbeatLoop()
	go c.leaderElectionLoop()
	go c.eventLoop()

	// Register node in cluster
	c.registerNode(node)

	c.logger.Info("Cluster node started", 
		zap.String("node_id", c.nodeID),
		zap.String("role", string(c.role)))

	return nil
}

// Stop shuts down the cluster operations
func (c *Cluster) Stop() error {
	if c == nil {
		return nil // Clustering is disabled
	}

	c.cancel()
	
	// Unregister from cluster
	c.client.HDel(c.ctx, "veloflux:nodes", c.nodeID)
	
	// Publish leave event
	event := ClusterEvent{
		Type:      "node_leave",
		Timestamp: time.Now(),
		NodeID:    c.nodeID,
	}
	
	data, _ := json.Marshal(event)
	c.client.Publish(c.ctx, "veloflux:events", data)
	
	// Close connections
	if c.pubsub != nil {
		c.pubsub.Close()
	}
	
	if c.client != nil {
		c.client.Close()
	}

	c.logger.Info("Cluster node stopped", zap.String("node_id", c.nodeID))
	return nil
}

// RegisterStateListener registers a callback for state changes
func (c *Cluster) RegisterStateListener(stateType StateType, listener StateChangeListener) {
	if c == nil {
		return // Clustering is disabled
	}

	c.listenersMutex.Lock()
	defer c.listenersMutex.Unlock()

	if _, ok := c.stateListeners[stateType]; !ok {
		c.stateListeners[stateType] = make([]StateChangeListener, 0)
	}

	c.stateListeners[stateType] = append(c.stateListeners[stateType], listener)
}

// PublishState publishes a state change to the cluster
func (c *Cluster) PublishState(stateType StateType, key string, value []byte) error {
	if c == nil {
		return nil // Clustering is disabled
	}

	// Store in Redis
	err := c.client.HSet(c.ctx, fmt.Sprintf("veloflux:state:%s", stateType), key, value).Err()
	if err != nil {
		return err
	}

	// Notify other nodes
	event := ClusterEvent{
		Type:      "state_change",
		Timestamp: time.Now(),
		NodeID:    c.nodeID,
		Payload: map[string]interface{}{
			"state_type": stateType,
			"key":        key,
		},
	}

	data, _ := json.Marshal(event)
	return c.client.Publish(c.ctx, "veloflux:events", data).Err()
}

// GetState retrieves a state value from the cluster
func (c *Cluster) GetState(stateType StateType, key string) ([]byte, error) {
	if c == nil {
		return nil, fmt.Errorf("clustering disabled")
	}

	return c.client.HGet(c.ctx, fmt.Sprintf("veloflux:state:%s", stateType), key).Bytes()
}

// GetAllState retrieves all state values of a given type
func (c *Cluster) GetAllState(stateType StateType) (map[string][]byte, error) {
	if c == nil {
		return nil, fmt.Errorf("clustering disabled")
	}

	result, err := c.client.HGetAll(c.ctx, fmt.Sprintf("veloflux:state:%s", stateType)).Result()
	if err != nil {
		return nil, err
	}

	// Convert string values to byte arrays
	byteMap := make(map[string][]byte, len(result))
	for k, v := range result {
		byteMap[k] = []byte(v)
	}

	return byteMap, nil
}

// IsLeader returns whether this node is the cluster leader
func (c *Cluster) IsLeader() bool {
	if c == nil {
		return true // If clustering is disabled, this node is effectively the leader
	}
	return c.role == RoleLeader
}

// GetNodes returns all nodes in the cluster
func (c *Cluster) GetNodes() []*ClusterNode {
	if c == nil {
		// Return just this node if clustering is disabled
		return []*ClusterNode{
			{
				ID:        "standalone",
				Role:      RoleLeader,
				LastSeen:  time.Now(),
				IsHealthy: true,
			},
		}
	}

	c.nodesMutex.RLock()
	defer c.nodesMutex.RUnlock()

	nodes := make([]*ClusterNode, 0, len(c.nodes))
	for _, node := range c.nodes {
		nodes = append(nodes, node)
	}

	return nodes
}

// SetNodeAddress sets the address for this node
func (c *Cluster) SetNodeAddress(address string) {
	if c == nil {
		return // Clustering is disabled
	}

	c.nodesMutex.Lock()
	if node, exists := c.nodes[c.nodeID]; exists {
		node.Address = address
	}
	c.nodesMutex.Unlock()

	// Update node in Redis
	nodeData, _ := json.Marshal(c.nodes[c.nodeID])
	c.client.HSet(c.ctx, "veloflux:nodes", c.nodeID, nodeData)
}

// NodeID returns this node's ID
func (c *Cluster) NodeID() string {
	if c == nil {
		return "standalone"
	}
	return c.nodeID
}

// Private methods

func (c *Cluster) heartbeatLoop() {
	ticker := time.NewTicker(c.config.HeartbeatInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			c.sendHeartbeat()
			c.checkNodes()
		case <-c.ctx.Done():
			return
		}
	}
}

func (c *Cluster) leaderElectionLoop() {
	ticker := time.NewTicker(c.config.HeartbeatInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			c.performLeaderElection()
		case <-c.ctx.Done():
			return
		}
	}
}

func (c *Cluster) eventLoop() {
	ch := c.pubsub.Channel()

	for {
		select {
		case msg, ok := <-ch:
			if !ok {
				return
			}
			c.handleEvent(msg.Payload)
		case <-c.ctx.Done():
			return
		}
	}
}

func (c *Cluster) sendHeartbeat() {
	c.nodesMutex.RLock()
	node, exists := c.nodes[c.nodeID]
	c.nodesMutex.RUnlock()

	if !exists {
		return
	}

	// Update last seen
	node.LastSeen = time.Now()

	// Save to Redis
	nodeData, _ := json.Marshal(node)
	c.client.HSet(c.ctx, "veloflux:nodes", c.nodeID, nodeData)

	// Publish heartbeat event
	event := ClusterEvent{
		Type:      "heartbeat",
		Timestamp: time.Now(),
		NodeID:    c.nodeID,
	}

	data, _ := json.Marshal(event)
	c.client.Publish(c.ctx, "veloflux:events", data)
}

func (c *Cluster) checkNodes() {
	// Get all nodes from Redis
	nodesMap, err := c.client.HGetAll(c.ctx, "veloflux:nodes").Result()
	if err != nil {
		c.logger.Error("Failed to get nodes", zap.Error(err))
		return
	}

	now := time.Now()
	newNodes := make(map[string]*ClusterNode)

	for id, data := range nodesMap {
		var node ClusterNode
		if err := json.Unmarshal([]byte(data), &node); err != nil {
			c.logger.Error("Failed to unmarshal node data", zap.Error(err))
			continue
		}

		// Mark node as unhealthy if not seen recently
		if now.Sub(node.LastSeen) > c.config.LeaderTimeout {
			node.IsHealthy = false
		}

		newNodes[id] = &node
	}

	// Update nodes map
	c.nodesMutex.Lock()
	c.nodes = newNodes
	c.nodesMutex.Unlock()
}

func (c *Cluster) performLeaderElection() {
	// Skip if already leader
	if c.role == RoleLeader {
		// Extend leadership
		c.client.SetEX(c.ctx, "veloflux:leader", c.nodeID, c.config.LeaderTimeout*2)
		return
	}

	// Check if there's a healthy leader
	leaderID, err := c.client.Get(c.ctx, "veloflux:leader").Result()
	if err == nil && leaderID != "" {
		// Leader exists, check if it's healthy
		c.nodesMutex.RLock()
		leaderNode, exists := c.nodes[leaderID]
		c.nodesMutex.RUnlock()

		if exists && leaderNode.IsHealthy {
			return // Leader is healthy, no need for election
		}
	}

	// Try to become leader
	success, err := c.client.SetNX(c.ctx, "veloflux:leader", c.nodeID, c.config.LeaderTimeout*2).Result()
	if err != nil {
		c.logger.Error("Error in leader election", zap.Error(err))
		return
	}

	if success {
		// Became leader!
		c.role = RoleLeader
		c.logger.Info("Node promoted to leader", zap.String("node_id", c.nodeID))

		// Update node info
		c.nodesMutex.Lock()
		if node, exists := c.nodes[c.nodeID]; exists {
			node.Role = RoleLeader
		}
		c.nodesMutex.Unlock()

		// Publish leadership event
		event := ClusterEvent{
			Type:      "leader_elected",
			Timestamp: time.Now(),
			NodeID:    c.nodeID,
		}

		data, _ := json.Marshal(event)
		c.client.Publish(c.ctx, "veloflux:events", data)
	}
}

func (c *Cluster) handleEvent(payload string) {
	var event ClusterEvent
	if err := json.Unmarshal([]byte(payload), &event); err != nil {
		c.logger.Error("Failed to unmarshal event", zap.Error(err))
		return
	}

	// Skip own events
	if event.NodeID == c.nodeID {
		return
	}

	switch event.Type {
	case "heartbeat":
		// Node heartbeat received, will be handled by checkNodes()
		
	case "node_leave":
		// Node left the cluster
		c.nodesMutex.Lock()
		delete(c.nodes, event.NodeID)
		c.nodesMutex.Unlock()
		
		c.logger.Info("Node left cluster", zap.String("node_id", event.NodeID))
		
	case "leader_elected":
		// New leader was elected
		if event.NodeID != c.nodeID {
			c.role = RoleFollower
			c.logger.Info("New leader elected", zap.String("leader_id", event.NodeID))
		}
		
	case "state_change":
		// State changed, notify listeners
		payload, ok := event.Payload.(map[string]interface{})
		if !ok {
			c.logger.Error("Invalid state change payload")
			return
		}
		
		stateType, ok := payload["state_type"].(string)
		if !ok {
			c.logger.Error("Invalid state type in payload")
			return
		}
		
		key, ok := payload["key"].(string)
		if !ok {
			c.logger.Error("Invalid key in payload")
			return
		}
		
		// Get the updated value from Redis
		value, err := c.GetState(StateType(stateType), key)
		if err != nil {
			c.logger.Error("Failed to get state value", zap.Error(err))
			return
		}
		
		// Notify listeners
		c.notifyStateListeners(StateType(stateType), key, value)
	}
}

func (c *Cluster) registerNode(node *ClusterNode) {
	c.nodesMutex.Lock()
	c.nodes[node.ID] = node
	c.nodesMutex.Unlock()

	// Save to Redis
	nodeData, _ := json.Marshal(node)
	c.client.HSet(c.ctx, "veloflux:nodes", node.ID, nodeData)

	// Publish join event
	event := ClusterEvent{
		Type:      "node_join",
		Timestamp: time.Now(),
		NodeID:    node.ID,
		Payload:   node,
	}

	data, _ := json.Marshal(event)
	c.client.Publish(c.ctx, "veloflux:events", data)
}

func (c *Cluster) notifyStateListeners(stateType StateType, key string, value []byte) {
	c.listenersMutex.RLock()
	listeners, exists := c.stateListeners[stateType]
	c.listenersMutex.RUnlock()

	if !exists {
		return
	}

	for _, listener := range listeners {
		go listener(stateType, key, value)
	}
}
