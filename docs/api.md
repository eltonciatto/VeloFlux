# 📡 VeloFlux API Documentation

## 🎯 **Overview**

> **Official VeloFlux Load Balancer API Documentation**  
> **Base URL:** `http://localhost:8080` (development) | `https://api.veloflux.io` (production)  
> **Version:** v1.0  
> **Authentication:** JWT Bearer Token  

VeloFlux provides a comprehensive RESTful API for managing load balancers, backend pools, authentication, multi-tenancy, AI/ML features, and more.

---

## 🔐 **Authentication**

### 🔑 **Login**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password",
  "tenant_id": "tenant_123"
}
```

**Success Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "refresh_eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "user_id": "user_123",
    "email": "user@example.com",
    "tenant_id": "tenant_123",
    "role": "admin",
    "first_name": "John",
    "last_name": "Doe"
  },
  "expires_in": 3600
}
```

### 📝 **Register**
```http
POST /auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "secure_password",
  "first_name": "Jane",
  "last_name": "Smith",
  "tenant_id": "tenant_123"
}
```

### 🔄 **Refresh Token**
```http
POST /auth/refresh
Authorization: Bearer <refresh_token>
```

### 👤 **User Profile**
```http
GET /api/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user_id": "user_123",
  "email": "user@example.com",
  "tenant_id": "tenant_123",
  "role": "admin",
  "first_name": "John",
  "last_name": "Doe",
  "created_at": "2025-06-19T10:00:00Z",
  "last_login": "2025-06-19T15:30:00Z"
}
```

---

## 🏊 **Pool Management**

### **List Pools**
```http
GET /api/pools
Authorization: Bearer <token>
```

**Response:**
```json
{
  "pools": [
    {
      "name": "web_servers",
      "algorithm": "weighted_round_robin",
      "sticky_sessions": true,
      "health_check": {
        "enabled": true,
        "path": "/health",
        "interval": "30s",
        "timeout": "5s"
      },
      "backends": [
        {
          "address": "192.168.1.10:8080",
          "weight": 100,
          "status": "healthy",
          "region": "us-east-1"
        }
      ]
    }
  ]
}
```

### **Create Pool**
```http
POST /api/pools
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "api_servers",
  "algorithm": "least_connections",
  "sticky_sessions": false,
  "health_check": {
    "path": "/api/health",
    "interval": "10s",
    "timeout": "3s",
    "expected_status": 200
  }
}
```

### **Get Specific Pool**
```http
GET /api/pools/{name}
Authorization: Bearer <token>
```

### **Update Pool**
```http
PUT /api/pools/{name}
Authorization: Bearer <token>
Content-Type: application/json

{
  "algorithm": "adaptive_ai",
  "sticky_sessions": true
}
```

### **Delete Pool**
```http
DELETE /api/pools/{name}
Authorization: Bearer <token>
```

---

## 🖥️ **Backend Management**

### **List Backends**
```http
GET /api/backends
Authorization: Bearer <token>
```

### **Add Backend**
```http
POST /api/backends
Authorization: Bearer <token>
Content-Type: application/json

{
  "address": "192.168.1.20:8080",
  "pool": "web_servers",
  "weight": 100,
  "region": "us-west-2",
  "health_check": {
    "path": "/health",
    "interval": "30s",
    "timeout": "5s",
    "expected_status": 200
  }
}
```

### **Update Backend**
```http
PUT /api/backends/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "weight": 150,
  "region": "us-east-1"
}
```

### **Remove Backend**
```http
DELETE /api/backends/{id}
Authorization: Bearer <token>
```

---

## 🛣️ **Route Management**

### **List Routes**
```http
GET /api/routes
Authorization: Bearer <token>
```

**Response:**
```json
{
  "routes": [
    {
      "id": "route_1",
      "host": "api.example.com",
      "path_prefix": "/v1",
      "pool": "api_servers",
      "ssl_enabled": true,
      "created_at": "2025-06-19T10:00:00Z"
    }
  ]
}
```

### **Create Route**
```http
POST /api/routes
Authorization: Bearer <token>
Content-Type: application/json

{
  "host": "app.example.com",
  "path_prefix": "/api",
  "pool": "api_servers",
  "ssl_enabled": true
}
```

### **Update Route**
```http
PUT /api/routes/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "pool": "new_api_servers",
  "ssl_enabled": true
}
```

### **Delete Route**
```http
DELETE /api/routes/{id}
Authorization: Bearer <token>
```

---

## 🏢 **Multi-Tenant Management**

### **List Tenants**
```http
GET /api/tenants
Authorization: Bearer <token>
```

**Response:**
```json
{
  "tenants": [
    {
      "id": "tenant_123",
      "name": "Acme Corp",
      "status": "active",
      "plan": "enterprise",
      "created_at": "2025-01-01T00:00:00Z",
      "user_count": 25,
      "usage": {
        "requests_per_month": 1000000,
        "bandwidth_gb": 500
      }
    }
  ]
}
```

### **Create Tenant**
```http
POST /api/tenants
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Company",
  "plan": "professional",
  "admin_email": "admin@newcompany.com",
  "settings": {
    "max_users": 50,
    "max_requests_per_month": 500000
  }
}
```

### **Get Tenant**
```http
GET /api/tenants/{id}
Authorization: Bearer <token>
```

### **Update Tenant**
```http
PUT /api/tenants/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Company Name",
  "plan": "enterprise",
  "settings": {
    "max_users": 100
  }
}
```

### **Delete Tenant**
```http
DELETE /api/tenants/{id}
Authorization: Bearer <token>
```

---

## 👥 **User Management (Tenant-Specific)**

### **List Tenant Users**
```http
GET /api/tenants/{tenant_id}/users
Authorization: Bearer <token>
```

### **Add User to Tenant**
```http
POST /api/tenants/{tenant_id}/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newuser@company.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "viewer",
  "password": "secure_password"
}
```

### **Update User**
```http
PUT /api/tenants/{tenant_id}/users/{user_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "admin",
  "first_name": "Updated Name"
}
```

### **Remove User**
```http
DELETE /api/tenants/{tenant_id}/users/{user_id}
Authorization: Bearer <token>
```

---

## 🤖 **AI/ML APIs**

### **AI Metrics**
```http
GET /api/ai/metrics
Authorization: Bearer <token>
```

**Response:**
```json
{
  "enabled": true,
  "current_algorithm": "adaptive_ai",
  "prediction_data": {
    "recommended_algorithm": "weighted_round_robin",
    "confidence": 0.85,
    "predicted_load": 750.5,
    "prediction_time": "2025-06-19T15:30:00Z",
    "optimal_backends": ["192.168.1.10:8080", "192.168.1.11:8080"],
    "scaling_recommendation": "scale_up"
  },
  "model_performance": {
    "load_predictor": {
      "accuracy": 0.92,
      "last_trained": "2025-06-19T10:00:00Z",
      "version": "1.2.0",
      "predictions_made": 15420
    }
  }
}
```

### **AI Status**
```http
GET /api/ai/status
Authorization: Bearer <token>
```

### **Predictions**
```http
GET /api/ai/predictions
Authorization: Bearer <token>
```

### **AI Configuration**
```http
GET /api/ai/config
Authorization: Bearer <token>
```

### **Update AI Configuration**
```http
PUT /api/ai/config
Authorization: Bearer <token>
Content-Type: application/json

{
  "enabled": true,
  "model_type": "neural_network",
  "confidence_threshold": 0.8,
  "predictive_scaling": true,
  "learning_rate": 0.001
}
```

### **Retrain Model**
```http
POST /api/ai/models/{modelType}/retrain
Authorization: Bearer <token>
```

---

## 💳 **Billing APIs**

### **List Subscriptions**
```http
GET /api/billing/subscriptions
Authorization: Bearer <token>
```

**Response:**
```json
{
  "subscriptions": [
    {
      "id": "sub_123",
      "tenant_id": "tenant_123",
      "plan": "enterprise",
      "status": "active",
      "current_period_start": "2025-06-01T00:00:00Z",
      "current_period_end": "2025-07-01T00:00:00Z",
      "amount": 99.99,
      "currency": "USD"
    }
  ]
}
```

### **Create Subscription**
```http
POST /api/billing/subscriptions
Authorization: Bearer <token>
Content-Type: application/json

{
  "plan": "professional",
  "payment_method": "card_123",
  "billing_cycle": "monthly"
}
```

### **List Invoices**
```http
GET /api/billing/invoices
Authorization: Bearer <token>
```

### **Billing Webhook**
```http
POST /api/billing/webhooks
Content-Type: application/json

{
  "type": "invoice.payment_succeeded",
  "data": {
    "object": {
      "id": "inv_123",
      "amount_paid": 9999,
      "currency": "usd"
    }
  }
}
```

---

## 📊 **Monitoring & Metrics**

### **Tenant Metrics**
```http
GET /api/tenants/{tenant_id}/metrics
Authorization: Bearer <token>
```

**Response:**
```json
{
  "requests_per_second": 125.4,
  "response_time_avg": 45.2,
  "error_rate": 0.02,
  "bandwidth_usage": {
    "inbound_mb": 1024.5,
    "outbound_mb": 2048.7
  },
  "top_endpoints": [
    {
      "path": "/api/users",
      "requests": 15420,
      "avg_response_time": 32.1
    }
  ]
}
```

### **Tenant Logs**
```http
GET /api/tenants/{tenant_id}/logs?limit=100&level=error
Authorization: Bearer <token>
```

### **Tenant Usage**
```http
GET /api/tenants/{tenant_id}/usage
Authorization: Bearer <token>
```

### **Tenant Status**
```http
GET /api/tenants/{tenant_id}/status
Authorization: Bearer <token>
```

---

## 🔧 **OIDC Configuration**

### **Get OIDC Configuration**
```http
GET /api/tenants/{tenant_id}/oidc/config
Authorization: Bearer <token>
```

### **Update OIDC Configuration**
```http
PUT /api/tenants/{tenant_id}/oidc/config
Authorization: Bearer <token>
Content-Type: application/json

{
  "provider_url": "https://auth0.example.com",
  "client_id": "your_client_id",
  "client_secret": "your_client_secret",
  "redirect_uri": "https://app.example.com/callback",
  "scopes": ["openid", "profile", "email"]
}
```

### **Test OIDC Configuration**
```http
POST /api/tenants/{tenant_id}/oidc/test
Authorization: Bearer <token>
```

---

## 🏥 **Health & Status**

### **General Health Check**
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-06-19T15:30:00Z",
  "version": "1.0.0",
  "uptime": "72h30m15s",
  "components": {
    "database": "healthy",
    "redis": "healthy",
    "load_balancer": "healthy",
    "ai_engine": "healthy"
  }
}
```

### **Cluster Status**
```http
GET /api/cluster
Authorization: Bearer <token>
```

### **General Configuration**
```http
GET /api/status
Authorization: Bearer <token>
```

---

## 💻 **Frontend Usage Examples**

### **Authentication JavaScript/TypeScript**
```javascript
// VeloFlux API Client
class VeloFluxAPI {
  constructor(baseURL = 'http://localhost:8080') {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('authToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  // Login
  async login(email, password, tenantId) {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          tenant_id: tenantId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.token = data.token;
        this.refreshToken = data.refresh_token;
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('refreshToken', data.refresh_token);
        return data;
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Refresh token
  async refreshAuthToken() {
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.refreshToken}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.token = data.token;
        localStorage.setItem('authToken', data.token);
        return data;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      this.logout();
      throw error;
    }
  }

  // Make authenticated request with auto-retry
  async makeAuthenticatedRequest(url, options = {}) {
    const requestOptions = {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    let response = await fetch(`${this.baseURL}${url}`, requestOptions);
    
    // Auto-retry with token refresh on 401
    if (response.status === 401 && this.refreshToken) {
      await this.refreshAuthToken();
      requestOptions.headers.Authorization = `Bearer ${this.token}`;
      response = await fetch(`${this.baseURL}${url}`, requestOptions);
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    
    return response;
  }

  // Logout
  logout() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
  }

  // Pool operations
  async getPools() {
    const response = await this.makeAuthenticatedRequest('/api/pools');
    return response.json();
  }

  async createPool(poolData) {
    const response = await this.makeAuthenticatedRequest('/api/pools', {
      method: 'POST',
      body: JSON.stringify(poolData)
    });
    return response.json();
  }

  async updatePool(poolName, updateData) {
    const response = await this.makeAuthenticatedRequest(`/api/pools/${poolName}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
    return response.json();
  }

  async deletePool(poolName) {
    const response = await this.makeAuthenticatedRequest(`/api/pools/${poolName}`, {
      method: 'DELETE'
    });
    return response.ok;
  }

  // Backend operations
  async addBackend(backendData) {
    const response = await this.makeAuthenticatedRequest('/api/backends', {
      method: 'POST',
      body: JSON.stringify(backendData)
    });
    return response.json();
  }

  // AI/ML operations
  async getAIMetrics() {
    const response = await this.makeAuthenticatedRequest('/api/ai/metrics');
    return response.json();
  }

  async updateAIConfig(configData) {
    const response = await this.makeAuthenticatedRequest('/api/ai/config', {
      method: 'PUT',
      body: JSON.stringify(configData)
    });
    return response.json();
  }

  // Tenant operations
  async getTenantMetrics(tenantId) {
    const response = await this.makeAuthenticatedRequest(`/api/tenants/${tenantId}/metrics`);
    return response.json();
  }

  async getTenantUsage(tenantId) {
    const response = await this.makeAuthenticatedRequest(`/api/tenants/${tenantId}/usage`);
    return response.json();
  }
}

// Usage example
const api = new VeloFluxAPI();

// Login and fetch pools
async function initializeApp() {
  try {
    await api.login('user@example.com', 'password', 'tenant_123');
    const pools = await api.getPools();
    console.log('Available pools:', pools);
  } catch (error) {
    console.error('Initialization failed:', error);
  }
}
```

### **Using React Hooks**
```typescript
// Custom API hook with advanced features
import { useState, useEffect, useCallback, useRef } from 'react';

interface Pool {
  name: string;
  algorithm: string;
  backends: Backend[];
  sticky_sessions: boolean;
  health_check: HealthCheck;
}

interface Backend {
  address: string;
  weight: number;
  status: 'healthy' | 'unhealthy' | 'unknown';
  region?: string;
}

interface HealthCheck {
  enabled: boolean;
  path: string;
  interval: string;
  timeout: string;
  expected_status?: number;
}

interface ApiError {
  error: boolean;
  code: string;
  message: string;
  details?: any;
}

// Enhanced hook with error handling and caching
export const usePools = () => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const apiRef = useRef(new VeloFluxAPI());

  const fetchPools = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      const data = await apiRef.current.getPools();
      setPools(data.pools || []);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Error loading pools');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPools();
    
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchPools]);

  const createPool = useCallback(async (poolData: Partial<Pool>) => {
    try {
      setError(null);
      const newPool = await apiRef.current.createPool(poolData);
      setPools(prev => [...prev, newPool]);
      return newPool;
    } catch (err: any) {
      setError(err.message || 'Error creating pool');
      throw err;
    }
  }, []);

  const updatePool = useCallback(async (poolName: string, updateData: Partial<Pool>) => {
    try {
      setError(null);
      const updatedPool = await apiRef.current.updatePool(poolName, updateData);
      setPools(prev => prev.map(pool => 
        pool.name === poolName ? { ...pool, ...updatedPool } : pool
      ));
      return updatedPool;
    } catch (err: any) {
      setError(err.message || 'Error updating pool');
      throw err;
    }
  }, []);

  const deletePool = useCallback(async (poolName: string) => {
    try {
      setError(null);
      await apiRef.current.deletePool(poolName);
      setPools(prev => prev.filter(pool => pool.name !== poolName));
    } catch (err: any) {
      setError(err.message || 'Error deleting pool');
      throw err;
    }
  }, []);

  const refresh = useCallback(() => {
    fetchPools();
  }, [fetchPools]);

  return { 
    pools, 
    loading, 
    error, 
    createPool, 
    updatePool, 
    deletePool, 
    refresh 
  };
};

// AI Metrics Hook
export const useAIMetrics = (intervalMs: number = 30000) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiRef = useRef(new VeloFluxAPI());

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setError(null);
        const data = await apiRef.current.getAIMetrics();
        setMetrics(data);
      } catch (err: any) {
        setError(err.message || 'Error loading AI metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  return { metrics, loading, error };
};

// Tenant Usage Hook
export const useTenantUsage = (tenantId: string) => {
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiRef = useRef(new VeloFluxAPI());

  useEffect(() => {
    if (!tenantId) return;

    const fetchUsage = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiRef.current.getTenantUsage(tenantId);
        setUsage(data);
      } catch (err: any) {
        setError(err.message || 'Error loading tenant usage');
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, [tenantId]);

  return { usage, loading, error };
};

// Example usage in a React component
function PoolsManagement() {
  const { pools, loading, error, createPool, deletePool, refresh } = usePools();
  const { metrics: aiMetrics } = useAIMetrics();

  const handleCreatePool = async () => {
    try {
      await createPool({
        name: 'new-pool',
        algorithm: 'round_robin',
        sticky_sessions: false,
        health_check: {
          enabled: true,
          path: '/health',
          interval: '30s',
          timeout: '5s'
        }
      });
      alert('Pool created successfully!');
    } catch (error) {
      alert('Failed to create pool');
    }
  };

  if (loading) return <div>Loading pools...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Pools Management</h2>
      <button onClick={handleCreatePool}>Create New Pool</button>
      <button onClick={refresh}>Refresh</button>
      
      {aiMetrics && (
        <div>
          <h3>AI Recommendations</h3>
          <p>Recommended Algorithm: {aiMetrics.prediction_data?.recommended_algorithm}</p>
          <p>Confidence: {(aiMetrics.prediction_data?.confidence * 100).toFixed(1)}%</p>
        </div>
      )}
      
      <ul>
        {pools.map(pool => (
          <li key={pool.name}>
            <strong>{pool.name}</strong> - {pool.algorithm}
            <button onClick={() => deletePool(pool.name)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 🤖 **Automation & Scripts**

### **Bash/Shell Scripts**
```bash
#!/bin/bash
# VeloFlux Pool Management Script

VELOFLUX_API="http://localhost:8080"
TOKEN=""

# Login function
login() {
    local email="$1"
    local password="$2"
    local tenant_id="$3"
    
    response=$(curl -s -X POST "${VELOFLUX_API}/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\",\"tenant_id\":\"$tenant_id\"}")
    
    TOKEN=$(echo "$response" | jq -r '.token')
    
    if [ "$TOKEN" = "null" ]; then
        echo "Login failed!"
        exit 1
    fi
    
    echo "Login successful!"
}

# Create pool function
create_pool() {
    local pool_name="$1"
    local algorithm="$2"
    
    curl -s -X POST "${VELOFLUX_API}/api/pools" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\":\"$pool_name\",
            \"algorithm\":\"$algorithm\",
            \"sticky_sessions\":false,
            \"health_check\":{
                \"enabled\":true,
                \"path\":\"/health\",
                \"interval\":\"30s\",
                \"timeout\":\"5s\"
            }
        }" | jq '.'
}

# Add backend function
add_backend() {
    local address="$1"
    local pool="$2"
    local weight="$3"
    
    curl -s -X POST "${VELOFLUX_API}/api/backends" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"address\":\"$address\",
            \"pool\":\"$pool\",
            \"weight\":$weight
        }" | jq '.'
}

# List pools function
list_pools() {
    curl -s -X GET "${VELOFLUX_API}/api/pools" \
        -H "Authorization: Bearer $TOKEN" | jq '.pools[]'
}

# Get AI metrics
get_ai_metrics() {
    curl -s -X GET "${VELOFLUX_API}/api/ai/metrics" \
        -H "Authorization: Bearer $TOKEN" | jq '.'
}

# Health check
health_check() {
    curl -s -X GET "${VELOFLUX_API}/health" | jq '.'
}

# Main execution
if [ "$#" -eq 0 ]; then
    echo "Usage: $0 <command> [args...]"
    echo "Commands:"
    echo "  login <email> <password> <tenant_id>"
    echo "  create-pool <name> <algorithm>"
    echo "  add-backend <address> <pool> <weight>"
    echo "  list-pools"
    echo "  ai-metrics"
    echo "  health"
    exit 1
fi

case "$1" in
    "login")
        login "$2" "$3" "$4"
        ;;
    "create-pool")
        create_pool "$2" "$3"
        ;;
    "add-backend")
        add_backend "$2" "$3" "$4"
        ;;
    "list-pools")
        list_pools
        ;;
    "ai-metrics")
        get_ai_metrics
        ;;
    "health")
        health_check
        ;;
    *)
        echo "Unknown command: $1"
        exit 1
        ;;
esac
```

### **Python Scripts**
```python
#!/usr/bin/env python3
"""
VeloFlux API Client for Python
"""
import requests
import json
import time
from typing import Dict, List, Optional

class VeloFluxClient:
    def __init__(self, base_url: str = "http://localhost:8080"):
        self.base_url = base_url.rstrip('/')
        self.token = None
        self.refresh_token = None
        self.session = requests.Session()
    
    def login(self, email: str, password: str, tenant_id: str) -> Dict:
        """Authenticate with VeloFlux API"""
        response = self.session.post(
            f"{self.base_url}/auth/login",
            json={
                "email": email,
                "password": password,
                "tenant_id": tenant_id
            }
        )
        response.raise_for_status()
        
        data = response.json()
        if data.get('success'):
            self.token = data['token']
            self.refresh_token = data['refresh_token']
            self.session.headers.update({
                'Authorization': f'Bearer {self.token}'
            })
        
        return data
    
    def refresh_auth_token(self) -> bool:
        """Refresh authentication token"""
        if not self.refresh_token:
            return False
        
        try:
            response = self.session.post(
                f"{self.base_url}/auth/refresh",
                headers={'Authorization': f'Bearer {self.refresh_token}'}
            )
            response.raise_for_status()
            
            data = response.json()
            self.token = data['token']
            self.session.headers.update({
                'Authorization': f'Bearer {self.token}'
            })
            return True
        except:
            return False
    
    def _make_request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """Make authenticated request with auto-retry"""
        url = f"{self.base_url}{endpoint}"
        response = self.session.request(method, url, **kwargs)
        
        # Auto-retry on 401
        if response.status_code == 401 and self.refresh_auth_token():
            response = self.session.request(method, url, **kwargs)
        
        response.raise_for_status()
        return response
    
    # Pool management
    def get_pools(self) -> List[Dict]:
        response = self._make_request('GET', '/api/pools')
        return response.json().get('pools', [])
    
    def create_pool(self, name: str, algorithm: str, **kwargs) -> Dict:
        pool_data = {
            'name': name,
            'algorithm': algorithm,
            **kwargs
        }
        response = self._make_request('POST', '/api/pools', json=pool_data)
        return response.json()
    
    def update_pool(self, name: str, **kwargs) -> Dict:
        response = self._make_request('PUT', f'/api/pools/{name}', json=kwargs)
        return response.json()
    
    def delete_pool(self, name: str) -> bool:
        self._make_request('DELETE', f'/api/pools/{name}')
        return True
    
    # Backend management
    def add_backend(self, address: str, pool: str, weight: int = 100, **kwargs) -> Dict:
        backend_data = {
            'address': address,
            'pool': pool,
            'weight': weight,
            **kwargs
        }
        response = self._make_request('POST', '/api/backends', json=backend_data)
        return response.json()
    
    # AI/ML operations
    def get_ai_metrics(self) -> Dict:
        response = self._make_request('GET', '/api/ai/metrics')
        return response.json()
    
    def update_ai_config(self, **kwargs) -> Dict:
        response = self._make_request('PUT', '/api/ai/config', json=kwargs)
        return response.json()
    
    # Monitoring
    def get_tenant_metrics(self, tenant_id: str) -> Dict:
        response = self._make_request('GET', f'/api/tenants/{tenant_id}/metrics')
        return response.json()
    
    def get_health(self) -> Dict:
        response = self.session.get(f"{self.base_url}/health")
        response.raise_for_status()
        return response.json()

# Example usage and automation scripts
def setup_production_environment(client: VeloFluxClient):
    """Setup a complete production environment"""
    
    # Create main API pool
    client.create_pool(
        name="api_production",
        algorithm="adaptive_ai",
        sticky_sessions=False,
        health_check={
            "enabled": True,
            "path": "/api/health",
            "interval": "10s",
            "timeout": "3s",
            "expected_status": 200
        }
    )
    
    # Add multiple backends
    backends = [
        {"address": "10.0.1.10:8080", "weight": 100, "region": "us-east-1"},
        {"address": "10.0.1.11:8080", "weight": 100, "region": "us-east-1"},
        {"address": "10.0.2.10:8080", "weight": 80, "region": "us-west-2"},
    ]
    
    for backend in backends:
        client.add_backend(pool="api_production", **backend)
    
    # Enable AI features
    client.update_ai_config(
        enabled=True,
        model_type="neural_network",
        confidence_threshold=0.8,
        predictive_scaling=True
    )
    
    print("Production environment setup complete!")

def monitor_system_health(client: VeloFluxClient, tenant_id: str):
    """Monitor system health and metrics"""
    
    while True:
        try:
            # Check general health
            health = client.get_health()
            print(f"System status: {health['status']}")
            
            # Check AI metrics
            ai_metrics = client.get_ai_metrics()
            if ai_metrics['enabled']:
                confidence = ai_metrics['prediction_data']['confidence']
                print(f"AI Confidence: {confidence:.2%}")
            
            # Check tenant metrics
            tenant_metrics = client.get_tenant_metrics(tenant_id)
            rps = tenant_metrics['requests_per_second']
            error_rate = tenant_metrics['error_rate']
            print(f"RPS: {rps:.1f}, Error Rate: {error_rate:.2%}")
            
            time.sleep(30)  # Check every 30 seconds
            
        except KeyboardInterrupt:
            print("Monitoring stopped")
            break
        except Exception as e:
            print(f"Monitoring error: {e}")
            time.sleep(5)

# Main execution
if __name__ == "__main__":
    client = VeloFluxClient()
    
    # Login
    client.login(
        email="admin@example.com",
        password="your_password",
        tenant_id="tenant_123"
    )
    
    # Setup environment
    setup_production_environment(client)
    
    # Start monitoring
    monitor_system_health(client, "tenant_123")
```

---

## 🚫 **Error Codes & Troubleshooting**

### **HTTP Status Codes**
| Code | Status | Meaning | Common Causes |
|------|--------|---------|---------------|
| `200` | Success | Operation successful | - |
| `201` | Created | Resource created successfully | - |
| `204` | No Content | Operation successful, no response body | Delete operations |
| `400` | Bad Request | Invalid or malformed data | Missing required fields, invalid JSON |
| `401` | Unauthorized | Invalid/expired token | Token expired, invalid credentials |
| `403` | Forbidden | No permission | Insufficient role, tenant restrictions |
| `404` | Not Found | Resource not found | Wrong endpoint, resource doesn't exist |
| `409` | Conflict | Resource already exists | Duplicate pool/backend names |
| `422` | Validation Error | Data validation failed | Invalid algorithm, malformed email |
| `429` | Rate Limited | Too many requests | Exceeded rate limits |
| `500` | Internal Error | Internal server error | Database issues, service unavailable |
| `503` | Service Unavailable | Service temporarily unavailable | Maintenance mode, overloaded |

### **Error Response Format**
```json
{
  "error": true,
  "code": "VALIDATION_ERROR",
  "message": "Email is required",
  "details": {
    "field": "email",
    "constraint": "required",
    "provided_value": null
  },
  "timestamp": "2025-06-19T15:30:00Z",
  "request_id": "req_abc123xyz",
  "documentation_url": "https://docs.veloflux.io/errors#VALIDATION_ERROR"
}
```

### **Common Error Codes**
| Code | Description | Solution |
|------|-------------|----------|
| `AUTHENTICATION_FAILED` | Invalid login credentials | Check email/password, verify tenant_id |
| `TOKEN_EXPIRED` | JWT token has expired | Use refresh token or re-login |
| `INVALID_TOKEN` | Malformed or invalid token | Re-login to get new token |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions | Contact admin to update role |
| `TENANT_NOT_FOUND` | Tenant ID doesn't exist | Verify tenant_id parameter |
| `POOL_NOT_FOUND` | Pool doesn't exist | Check pool name spelling |
| `POOL_ALREADY_EXISTS` | Pool name already in use | Use different pool name |
| `BACKEND_NOT_FOUND` | Backend doesn't exist | Check backend ID |
| `INVALID_ALGORITHM` | Unsupported load balancing algorithm | Use: round_robin, weighted_round_robin, least_connections, adaptive_ai |
| `HEALTH_CHECK_FAILED` | Backend health check configuration invalid | Verify path, interval, timeout values |
| `RATE_LIMIT_EXCEEDED` | Too many API requests | Wait and retry, implement backoff |
| `BILLING_ERROR` | Payment or subscription issue | Check billing configuration |
| `AI_SERVICE_UNAVAILABLE` | AI/ML service temporarily down | Fallback to traditional algorithms |
| `VALIDATION_ERROR` | Request data validation failed | Check required fields and formats |

### **Troubleshooting Examples**

#### **Authentication Issues**
```javascript
// Handle authentication errors
async function handleAuthError(error) {
    if (error.code === 'TOKEN_EXPIRED') {
        // Try to refresh token
        try {
            await api.refreshAuthToken();
            return true; // Can retry request
        } catch (refreshError) {
            // Refresh failed, need to re-login
            window.location.href = '/login';
            return false;
        }
    }
    
    if (error.code === 'AUTHENTICATION_FAILED') {
        alert('Invalid credentials. Please check your email and password.');
        return false;
    }
    
    if (error.code === 'INSUFFICIENT_PERMISSIONS') {
        alert('You do not have permission to perform this action.');
        return false;
    }
    
    return false;
}
```

#### **Rate Limiting Handling**
```javascript
// Exponential backoff for rate limiting
async function makeRequestWithBackoff(requestFn, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await requestFn();
        } catch (error) {
            if (error.code === 'RATE_LIMIT_EXCEEDED') {
                const delay = Math.pow(2, i) * 1000; // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw error;
        }
    }
    throw new Error('Max retries exceeded');
}
```

#### **Validation Error Handling**
```javascript
// Handle validation errors
function handleValidationError(error) {
    const errors = {};
    
    if (error.details && Array.isArray(error.details)) {
        error.details.forEach(detail => {
            errors[detail.field] = detail.message || error.message;
        });
    } else if (error.details && error.details.field) {
        errors[error.details.field] = error.message;
    }
    
    return errors;
}

// Example usage in form
const [fieldErrors, setFieldErrors] = useState({});

const handleSubmit = async (formData) => {
    try {
        await api.createPool(formData);
        setFieldErrors({});
    } catch (error) {
        if (error.code === 'VALIDATION_ERROR') {
            setFieldErrors(handleValidationError(error));
        } else {
            alert(`Error: ${error.message}`);
        }
    }
};
```

---

## � **Webhooks & Events**

### **Webhook Configuration**
```http
POST /api/webhooks
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://your-app.com/webhooks/veloflux",
  "events": ["pool.created", "backend.health_changed", "ai.recommendation"],
  "secret": "your_webhook_secret",
  "enabled": true
}
```

### **Available Events**
| Event Type | Description | Payload |
|------------|-------------|---------|
| `pool.created` | New pool created | Pool details |
| `pool.updated` | Pool configuration changed | Pool details + changes |
| `pool.deleted` | Pool removed | Pool name + timestamp |
| `backend.added` | Backend added to pool | Backend details |
| `backend.removed` | Backend removed from pool | Backend details |
| `backend.health_changed` | Backend health status changed | Backend + health status |
| `ai.recommendation` | AI algorithm recommendation | Recommendation details |
| `tenant.usage_threshold` | Usage threshold exceeded | Usage details |
| `billing.invoice_created` | New invoice generated | Invoice details |
| `billing.payment_failed` | Payment processing failed | Payment details |

### **Webhook Payload Example**
```json
{
  "event": "backend.health_changed",
  "timestamp": "2025-06-19T15:30:00Z",
  "tenant_id": "tenant_123",
  "data": {
    "backend": {
      "id": "backend_456",
      "address": "192.168.1.10:8080",
      "pool": "web_servers",
      "previous_status": "healthy",
      "current_status": "unhealthy",
      "health_check_details": {
        "path": "/health",
        "response_time": 5000,
        "status_code": 503,
        "error": "Connection timeout"
      }
    }
  },
  "signature": "sha256=abc123..."
}
```

### **Webhook Verification**
```javascript
// Verify webhook signature
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
    
    const providedSignature = signature.replace('sha256=', '');
    
    return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
    );
}

// Express.js webhook handler
app.post('/webhooks/veloflux', express.raw({type: 'application/json'}), (req, res) => {
    const signature = req.headers['x-veloflux-signature'];
    const isValid = verifyWebhookSignature(req.body, signature, process.env.WEBHOOK_SECRET);
    
    if (!isValid) {
        return res.status(401).send('Invalid signature');
    }
    
    const event = JSON.parse(req.body);
    
    switch (event.event) {
        case 'backend.health_changed':
            handleBackendHealthChange(event.data);
            break;
        case 'ai.recommendation':
            handleAIRecommendation(event.data);
            break;
        // ... handle other events
    }
    
    res.status(200).send('OK');
});
```

---

## 🔒 **Security & Best Practices**

### **Authentication & Authorization**
```http
# Always use HTTPS in production
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
X-Request-ID: unique-request-id-123
```

### **Security Headers**
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

### **Rate Limiting**
- **Free tier:** 100 requests/hour per token
- **Professional:** 1,000 requests/hour per token  
- **Enterprise:** 10,000 requests/hour per token
- **Response headers:**
  ```
  X-RateLimit-Limit: 1000
  X-RateLimit-Remaining: 999
  X-RateLimit-Reset: 1640995200
  X-RateLimit-Window: 3600
  ```

### **CORS Configuration**
```javascript
// CORS headers (configurable per tenant)
Access-Control-Allow-Origin: https://your-domain.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, X-Request-ID
Access-Control-Max-Age: 86400
```

### **API Security Best Practices**
1. **Use HTTPS only** - Never send tokens over HTTP
2. **Rotate tokens regularly** - Implement automatic token refresh
3. **Validate all inputs** - Sanitize and validate all API inputs
4. **Monitor for anomalies** - Track unusual API usage patterns
5. **Implement proper CORS** - Configure CORS for your domains only
6. **Use request signing** - Sign critical requests with HMAC
7. **Log security events** - Monitor failed authentication attempts
8. **Implement IP whitelisting** - Restrict API access by IP when possible

---

## 📊 **Performance & Optimization**

### **Request Optimization**
```javascript
// Batch multiple operations
const batchOperations = async () => {
    const operations = [
        api.createPool({name: 'pool1', algorithm: 'round_robin'}),
        api.createPool({name: 'pool2', algorithm: 'least_connections'}),
        api.addBackend({address: '10.0.1.1:80', pool: 'pool1', weight: 100})
    ];
    
    const results = await Promise.all(operations);
    return results;
};

// Use compression for large payloads
const makeCompressedRequest = async (url, data) => {
    const compressed = gzip(JSON.stringify(data));
    
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Encoding': 'gzip',
            'Authorization': `Bearer ${token}`
        },
        body: compressed
    });
};
```

### **Caching Strategies**
```javascript
// Client-side caching with TTL
class APICache {
    constructor(ttlMs = 300000) { // 5 minutes default
        this.cache = new Map();
        this.ttl = ttlMs;
    }
    
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return item.data;
    }
    
    set(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }
}

const cache = new APICache();

// Cached API calls
const getCachedPools = async () => {
    const cacheKey = 'pools';
    let pools = cache.get(cacheKey);
    
    if (!pools) {
        pools = await api.getPools();
        cache.set(cacheKey, pools);
    }
    
    return pools;
};
```

---

## 🔗 **URLs and Environments**

### **Development Environment**
- **Backend API:** `http://localhost:8080`
- **Frontend Dashboard:** `http://localhost:3000`
- **Prometheus Metrics:** `http://localhost:9090`
- **Grafana Dashboard:** `http://localhost:3001`
- **Admin Console:** `http://localhost:8081`

### **Staging Environment**
- **API:** `https://api-staging.veloflux.io`
- **Dashboard:** `https://dashboard-staging.veloflux.io`
- **Docs:** `https://docs-staging.veloflux.io`

### **Production Environment**
- **API:** `https://api.veloflux.io`
- **Dashboard:** `https://dashboard.veloflux.io`
- **Documentation:** `https://docs.veloflux.io`
- **Status Page:** `https://status.veloflux.io`
- **Support Portal:** `https://support.veloflux.io`

### **Regional Endpoints**
- **US East:** `https://us-east-api.veloflux.io`
- **US West:** `https://us-west-api.veloflux.io`
- **Europe:** `https://eu-api.veloflux.io`
- **Asia Pacific:** `https://ap-api.veloflux.io`

---

## 📚 **Additional Resources**

### **SDKs and Libraries**
- **JavaScript/TypeScript:** `npm install @veloflux/api-client`
- **Python:** `pip install veloflux-python`
- **Go:** `go get github.com/veloflux/go-client`
- **Java:** Maven/Gradle dependency available
- **C#/.NET:** NuGet package available

### **Tools & Integrations**
- **Terraform Provider:** Infrastructure as Code
- **Kubernetes Operator:** Native K8s integration
- **Helm Charts:** Easy deployment
- **Docker Images:** Containerized deployment
- **Prometheus Exporter:** Metrics integration
- **Grafana Dashboards:** Visualization templates

### **Community & Support**
- **GitHub:** [github.com/eltonciatto/veloflux](https://github.com/eltonciatto/veloflux)
- **Documentation:** [docs.veloflux.io](https://docs.veloflux.io)
- **Community Forum:** [community.veloflux.io](https://community.veloflux.io)
- **Discord:** [discord.gg/veloflux](https://discord.gg/veloflux)
- **Stack Overflow:** Tag `veloflux`

---

**📚 Documentation last updated: June 19, 2025**  
**🔄 API Version: v1.0**  
**📧 Support: contact@veloflux.io**  
**🌐 Website: [veloflux.io](https://veloflux.io)**  
**📖 Changelog: [docs.veloflux.io/changelog](https://docs.veloflux.io/changelog)**

