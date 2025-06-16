package backup

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/go-redis/redis/v8"
	"go.uber.org/zap"
)

type BackupManager struct {
	client    *redis.Client
	logger    *zap.Logger
	config    *BackupConfig
	scheduler *time.Ticker
}

type BackupConfig struct {
	Enabled         bool          `yaml:"enabled"`
	Interval        time.Duration `yaml:"interval"`
	BackupDir       string        `yaml:"backup_dir"`
	RetentionDays   int           `yaml:"retention_days"`
	S3Config        *S3Config     `yaml:"s3_config,omitempty"`
	EncryptionKey   string        `yaml:"encryption_key,omitempty"`
	CompressionType string        `yaml:"compression_type"` // gzip, lz4, none
}

type S3Config struct {
	Bucket    string `yaml:"bucket"`
	Region    string `yaml:"region"`
	AccessKey string `yaml:"access_key"`
	SecretKey string `yaml:"secret_key"`
	Endpoint  string `yaml:"endpoint,omitempty"`
}

type BackupMetadata struct {
	Timestamp   time.Time `json:"timestamp"`
	Size        int64     `json:"size"`
	Checksum    string    `json:"checksum"`
	Compressed  bool      `json:"compressed"`
	Encrypted   bool      `json:"encrypted"`
	TenantCount int       `json:"tenant_count"`
	KeyCount    int       `json:"key_count"`
}

func NewBackupManager(client *redis.Client, config *BackupConfig, logger *zap.Logger) *BackupManager {
	return &BackupManager{
		client: client,
		logger: logger.Named("backup"),
		config: config,
	}
}

func (bm *BackupManager) Start() error {
	if !bm.config.Enabled {
		bm.logger.Info("Backup system is disabled")
		return nil
	}

	// Ensure backup directory exists
	if err := os.MkdirAll(bm.config.BackupDir, 0755); err != nil {
		return fmt.Errorf("failed to create backup directory: %w", err)
	}

	// Start periodic backups
	bm.scheduler = time.NewTicker(bm.config.Interval)

	go func() {
		// Perform initial backup
		if err := bm.performBackup(); err != nil {
			bm.logger.Error("Initial backup failed", zap.Error(err))
		}

		// Periodic backups
		for range bm.scheduler.C {
			if err := bm.performBackup(); err != nil {
				bm.logger.Error("Scheduled backup failed", zap.Error(err))
			}
		}
	}()

	// Start cleanup routine
	go bm.cleanupOldBackups()

	bm.logger.Info("Backup manager started",
		zap.Duration("interval", bm.config.Interval),
		zap.String("backup_dir", bm.config.BackupDir))

	return nil
}

func (bm *BackupManager) Stop() {
	if bm.scheduler != nil {
		bm.scheduler.Stop()
		bm.logger.Info("Backup manager stopped")
	}
}

func (bm *BackupManager) performBackup() error {
	ctx := context.Background()
	timestamp := time.Now()

	bm.logger.Info("Starting backup", zap.Time("timestamp", timestamp))

	// Create backup filename
	filename := fmt.Sprintf("veloflux-backup-%s.json",
		timestamp.Format("20060102-150405"))
	backupPath := filepath.Join(bm.config.BackupDir, filename)

	// Get all keys
	keys, err := bm.getAllKeys(ctx)
	if err != nil {
		return fmt.Errorf("failed to get keys: %w", err)
	}

	// Create backup data
	backupData := make(map[string]interface{})
	tenantCount := 0

	for _, key := range keys {
		value, err := bm.getKeyValue(ctx, key)
		if err != nil {
			bm.logger.Warn("Failed to get key value",
				zap.String("key", key), zap.Error(err))
			continue
		}

		backupData[key] = value

		// Count tenants
		if isValidTenantKey(key) {
			tenantCount++
		}
	}

	// Create metadata
	metadata := &BackupMetadata{
		Timestamp:   timestamp,
		TenantCount: tenantCount,
		KeyCount:    len(keys),
		Compressed:  bm.config.CompressionType != "none",
		Encrypted:   bm.config.EncryptionKey != "",
	}

	// Write backup file
	if err := bm.writeBackupFile(backupPath, backupData, metadata); err != nil {
		return fmt.Errorf("failed to write backup file: %w", err)
	}

	// Upload to S3 if configured
	if bm.config.S3Config != nil {
		if err := bm.uploadToS3(backupPath, filename); err != nil {
			bm.logger.Error("Failed to upload backup to S3", zap.Error(err))
			// Don't fail the backup if S3 upload fails
		}
	}

	bm.logger.Info("Backup completed successfully",
		zap.String("file", backupPath),
		zap.Int("tenant_count", tenantCount),
		zap.Int("key_count", len(keys)),
		zap.Int64("size", metadata.Size))

	return nil
}

func (bm *BackupManager) RestoreFromBackup(backupPath string) error {
	ctx := context.Background()

	bm.logger.Info("Starting restore from backup", zap.String("path", backupPath))

	// Read and parse backup file
	backupData, metadata, err := bm.readBackupFile(backupPath)
	if err != nil {
		return fmt.Errorf("failed to read backup file: %w", err)
	}

	// Verify backup integrity
	if err := bm.verifyBackupIntegrity(backupData, metadata); err != nil {
		return fmt.Errorf("backup integrity check failed: %w", err)
	}

	// Restore data
	pipeline := bm.client.Pipeline()
	restoredCount := 0

	for key, value := range backupData {
		// Set key value based on type
		if err := bm.setKeyValue(ctx, pipeline, key, value); err != nil {
			bm.logger.Warn("Failed to restore key",
				zap.String("key", key), zap.Error(err))
			continue
		}
		restoredCount++
	}

	// Execute pipeline
	if _, err := pipeline.Exec(ctx); err != nil {
		return fmt.Errorf("failed to execute restore pipeline: %w", err)
	}

	bm.logger.Info("Restore completed successfully",
		zap.String("backup", backupPath),
		zap.Int("restored_keys", restoredCount),
		zap.Time("backup_timestamp", metadata.Timestamp))

	return nil
}

func (bm *BackupManager) cleanupOldBackups() {
	ticker := time.NewTicker(24 * time.Hour) // Run daily
	defer ticker.Stop()

	for range ticker.C {
		if err := bm.removeOldBackups(); err != nil {
			bm.logger.Error("Failed to cleanup old backups", zap.Error(err))
		}
	}
}

func (bm *BackupManager) removeOldBackups() error {
	cutoff := time.Now().AddDate(0, 0, -bm.config.RetentionDays)

	files, err := filepath.Glob(filepath.Join(bm.config.BackupDir, "veloflux-backup-*.json*"))
	if err != nil {
		return err
	}

	removedCount := 0
	for _, file := range files {
		info, err := os.Stat(file)
		if err != nil {
			continue
		}

		if info.ModTime().Before(cutoff) {
			if err := os.Remove(file); err != nil {
				bm.logger.Warn("Failed to remove old backup",
					zap.String("file", file), zap.Error(err))
				continue
			}
			removedCount++
		}
	}

	if removedCount > 0 {
		bm.logger.Info("Cleaned up old backups",
			zap.Int("removed_count", removedCount),
			zap.Time("cutoff_date", cutoff))
	}

	return nil
}

// Helper functions (implementations would be more detailed)
func (bm *BackupManager) getAllKeys(ctx context.Context) ([]string, error) {
	// Implementation to scan all keys
	return bm.client.Keys(ctx, "*").Result()
}

func (bm *BackupManager) getKeyValue(ctx context.Context, key string) (interface{}, error) {
	// Implementation to get value based on key type
	keyType, err := bm.client.Type(ctx, key).Result()
	if err != nil {
		return nil, err
	}

	switch keyType {
	case "string":
		return bm.client.Get(ctx, key).Result()
	case "hash":
		return bm.client.HGetAll(ctx, key).Result()
	case "list":
		return bm.client.LRange(ctx, key, 0, -1).Result()
	case "set":
		return bm.client.SMembers(ctx, key).Result()
	case "zset":
		return bm.client.ZRangeWithScores(ctx, key, 0, -1).Result()
	default:
		return nil, fmt.Errorf("unsupported key type: %s", keyType)
	}
}

func (bm *BackupManager) writeBackupFile(path string, data map[string]interface{}, metadata *BackupMetadata) error {
	// Implementation to write compressed/encrypted backup file
	// Would include JSON marshaling, compression, encryption
	return nil
}

func (bm *BackupManager) readBackupFile(path string) (map[string]interface{}, *BackupMetadata, error) {
	// Implementation to read and decompress/decrypt backup file
	return nil, nil, nil
}

func (bm *BackupManager) verifyBackupIntegrity(data map[string]interface{}, metadata *BackupMetadata) error {
	// Implementation to verify backup integrity using checksums
	return nil
}

func (bm *BackupManager) setKeyValue(ctx context.Context, pipeline redis.Pipeliner, key string, value interface{}) error {
	// Implementation to set key value based on type
	return nil
}

func (bm *BackupManager) uploadToS3(localPath, filename string) error {
	// Implementation to upload backup to S3
	return nil
}

func isValidTenantKey(key string) bool {
	return len(key) > 10 && key[:10] == "vf:tenant:"
}
