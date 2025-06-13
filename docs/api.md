# API Documentation

VeloFlux exposes a JSON HTTP API for managing pools and routes. All endpoints are served under the `/api` prefix.

| Method | Endpoint         | Description            |
| ------ | ---------------- | ---------------------- |
| GET    | `/pools`         | List configured pools  |
| POST   | `/pools`         | Create or update a pool|
| DELETE | `/pools/{name}`  | Remove a pool          |
| GET    | `/routes`        | List routes            |
| POST   | `/routes`        | Create or update a route|
| DELETE | `/routes/{host}` | Remove a route         |

Example listing pools:

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/pools
```

All responses are JSON objects. Refer to the configuration reference for the structure of pool and route objects.

