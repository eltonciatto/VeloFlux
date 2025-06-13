# API Documentation

VeloFlux exposes a comprehensive JSON HTTP API for managing tenants, pools, routes, and other configuration elements. All API endpoints require JWT authentication.

## Authentication Endpoints

| Method | Endpoint                  | Description                               |
| ------ | ------------------------- | ----------------------------------------- |
| POST   | `/auth/login`             | Login with email and password             |
| POST   | `/auth/register`          | Register a new account                    |
| POST   | `/auth/refresh`           | Refresh the authentication token          |

## User Management

| Method | Endpoint                  | Description                               |
| ------ | ------------------------- | ----------------------------------------- |
| GET    | `/api/profile`            | Get the current user's profile            |
| PUT    | `/api/profile`            | Update the current user's profile         |

## Tenant Management

| Method | Endpoint                              | Description                               |
| ------ | ------------------------------------- | ----------------------------------------- |
| GET    | `/api/tenants`                        | List all tenants                          |
| POST   | `/api/tenants`                        | Create a new tenant                       |
| GET    | `/api/tenants/{tenant_id}`            | Get a specific tenant's details           |
| PUT    | `/api/tenants/{tenant_id}`            | Update a tenant                           |
| DELETE | `/api/tenants/{tenant_id}`            | Delete a tenant                           |
| GET    | `/api/tenants/{tenant_id}/users`      | List users in a tenant                    |
| POST   | `/api/tenants/{tenant_id}/users`      | Add a user to a tenant                    |
| PUT    | `/api/tenants/{tenant_id}/users/{id}` | Update a user's role in a tenant          |
| DELETE | `/api/tenants/{tenant_id}/users/{id}` | Remove a user from a tenant               |

## Pool and Backend Management

| Method | Endpoint                                                    | Description                        |
| ------ | ----------------------------------------------------------- | ---------------------------------- |
| GET    | `/api/tenants/{tenant_id}/pools`                            | List tenant's pools                |
| POST   | `/api/tenants/{tenant_id}/pools`                            | Create a new pool                  |
| GET    | `/api/tenants/{tenant_id}/pools/{pool_name}`                | Get a specific pool                |
| PUT    | `/api/tenants/{tenant_id}/pools/{pool_name}`                | Update a pool's configuration      |
| DELETE | `/api/tenants/{tenant_id}/pools/{pool_name}`                | Delete a pool                      |
| POST   | `/api/tenants/{tenant_id}/pools/{pool_name}/backends`       | Add backend to a pool              |
| DELETE | `/api/tenants/{tenant_id}/pools/{pool_name}/backends/{addr}`| Remove backend from a pool         |

## Route Management

| Method | Endpoint                                        | Description                   |
| ------ | ----------------------------------------------- | ----------------------------- |
| GET    | `/api/tenants/{tenant_id}/routes`               | List tenant's routes          |
| POST   | `/api/tenants/{tenant_id}/routes`               | Create a route                |
| PUT    | `/api/tenants/{tenant_id}/routes/{route_id}`    | Update a route                |
| DELETE | `/api/tenants/{tenant_id}/routes/{route_id}`    | Delete a route                |

## Configuration and Monitoring

| Method | Endpoint                                     | Description                             |
| ------ | -------------------------------------------- | --------------------------------------- |
| GET    | `/api/tenants/{tenant_id}/waf/config`        | Get WAF configuration                   |
| PUT    | `/api/tenants/{tenant_id}/waf/config`        | Update WAF configuration                |
| GET    | `/api/tenants/{tenant_id}/rate-limit`        | Get rate limit configuration            |
| PUT    | `/api/tenants/{tenant_id}/rate-limit`        | Update rate limit configuration         |
| GET    | `/api/tenants/{tenant_id}/metrics`           | Get tenant-specific metrics             |
| GET    | `/api/tenants/{tenant_id}/usage`             | Get tenant usage statistics             |
| GET    | `/api/tenants/{tenant_id}/logs`              | Get tenant logs                         |

## Example Usage

```bash
# Login
curl -X POST http://localhost:9000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "yourpassword"}'

# List tenant pools (with JWT authentication)
curl -H "Authorization: Bearer <token>" \
  http://localhost:9000/api/tenants/tenant1/pools

# Update a route
curl -X PUT http://localhost:9000/api/tenants/tenant1/routes/route1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "example.com",
    "pool": "web-servers",
    "path_prefix": "/api"
  }'
```

All responses are JSON objects. Refer to the configuration reference for the structure of pool, route, tenant, and other configuration objects.

