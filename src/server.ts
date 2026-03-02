import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { setupProxyRoutes } from './routes/proxy';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// ─── CORS Configuration ───
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  })
);

// ─── Middleware ───
app.use(helmet());
app.use(morgan('dev'));
app.use(rateLimiter);

// ─── Gateway Health Check ───
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'gateway-service',
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    upstreams: {
      backend: process.env.BACKEND_SERVICE_URL || 'http://localhost:8002',
      ai: process.env.AI_SERVICE_URL || 'http://localhost:5000',
    },
  });
});

// ─── Proxy Routes ───
setupProxyRoutes(app);

// ─── Fallback Error Handling ───
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start Server ───
app.listen(PORT, () => {
  console.log(`\n  🚀 gateway-service running on http://localhost:${PORT}`);
  console.log(`  📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  🔗 CORS origins: ${allowedOrigins.join(', ')}`);
  console.log(`  ➜  /api/ai/*  →  ${process.env.AI_SERVICE_URL || 'http://localhost:5000'}`);
  console.log(`  ➜  /api/*     →  ${process.env.BACKEND_SERVICE_URL || 'http://localhost:8002'}\n`);
});

export default app;
