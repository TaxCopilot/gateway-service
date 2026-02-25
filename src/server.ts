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
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(rateLimiter);

// --- Gateway Health Check ---
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'gateway-service',
    timestamp: new Date().toISOString(),
    upstreams: {
      backend: process.env.BACKEND_SERVICE_URL || 'http://localhost:4000',
      ai: process.env.AI_SERVICE_URL || 'http://localhost:5000',
    },
  });
});

// --- Proxy Routes ---
setupProxyRoutes(app);

// --- Fallback Error Handling ---
app.use(notFoundHandler);
app.use(errorHandler);

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`[gateway-service] Running on port ${PORT}`);
  console.log(`[gateway-service] Proxying /api/ai/* -> ${process.env.AI_SERVICE_URL || 'http://localhost:5000'}`);
  console.log(`[gateway-service] Proxying /api/*    -> ${process.env.BACKEND_SERVICE_URL || 'http://localhost:4000'}`);
});

export default app;
