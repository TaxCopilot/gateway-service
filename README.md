# TaxCopilot Gateway Service

API Gateway for TaxCopilot — routes requests to backend-service and ai-service, enforces rate limiting and CORS.

## Overview

The gateway sits between the frontend and backend/ai services. It:
- Proxies `/api/*` to the backend service
- Proxies `/api/ai/*` to the AI service
- Proxies `/uploads/*` to the backend for static files
- Enforces per-user rate limiting (100 req/min per CA when JWT is present)
- Applies CORS, Helmet, and structured error handling

See [requirements.md](../requirements.md) and [design.md](../design.md) for full architecture.

## Prerequisites

- Node.js 20+
- Backend and AI services running

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with BACKEND_SERVICE_URL, AI_SERVICE_URL, CORS_ORIGIN, JWT_SECRET
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

   Gateway runs on http://localhost:8000.

## Scripts

| Command        | Description                 |
| -------------- | --------------------------- |
| `npm run dev`  | Start dev server (port 8000)|
| `npm run build`| TypeScript build            |
| `npm run start`| Run production build        |
| `npm run lint` | Run ESLint                  |

## Environment Variables

| Variable                | Description                       | Default                  |
| ----------------------- | --------------------------------- | ------------------------ |
| `PORT`                  | Server port                       | `8000`                   |
| `NODE_ENV`              | Environment                       | `development`            |
| `BACKEND_SERVICE_URL`   | Backend service URL               | `http://localhost:8002`  |
| `AI_SERVICE_URL`        | AI service URL                    | `http://localhost:8001`  |
| `CORS_ORIGIN`           | Allowed origins (comma-separated) | `http://localhost:3000`  |
| `JWT_SECRET`            | Same as backend (for rate limit)  | —                        |

## Rate Limiting

- **100 requests per minute** per user (when JWT is present) or per IP
- Uses `JWT_SECRET` to verify tokens and extract `userId` for per-user limits

## Docker

Run via Docker Compose from the project root:

```bash
docker-compose up --build
```
