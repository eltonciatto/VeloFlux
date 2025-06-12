# API Documentation

VeloFlux exposes a simple HTTP API for managing pools and routes. All endpoints
are prefixed with `/api` and require authentication if enabled.

| Method | Endpoint          | Description                  |
| ------ | ----------------- | ---------------------------- |
| GET    | `/pools`          | List configured pools        |
| POST   | `/pools`          | Create or update a pool      |
| DELETE | `/pools/{name}`   | Remove a pool                |
| GET    | `/routes`         | List routes                  |
| POST   | `/routes`         | Create or update a route     |
| DELETE | `/routes/{host}`  | Remove a route               |

Example request:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:8080/api/pools
=======
The admin API exposes endpoints for managing pools, backends and routes.

Example request:
```bash
curl http://localhost:8080/api/pools
>>>>>>> main
```
