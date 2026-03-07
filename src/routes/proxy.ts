import { Express } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';

/**
 * Gateway Proxy Routing
 *
 * Route Map:
 *   /api/ai/*    →  AI Service   (http://localhost:5000)
 *   /api/*       →  Backend Svc  (http://localhost:8002)
 *
 * IMPORTANT: We use `pathFilter` instead of `app.use('/api', ...)` because
 * Express strips the mount path prefix, which breaks downstream routing.
 * Using pathFilter at root keeps the full path intact.
 */
export function setupProxyRoutes(app: Express): void {
  const BACKEND_SERVICE_URL = process.env.BACKEND_SERVICE_URL || 'http://localhost:8002';
  const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';

  // ─────────────────────────────────────────────────────────────
  //  1. /api/ai/* → AI Service
  //     Handles: chat, analysis, drafting, suggestions
  //     Example: POST /api/ai/v1/decode-notice → AI_SERVICE_URL/api/v1/decode-notice
  // ─────────────────────────────────────────────────────────────
  const AI_API_KEY = process.env.AI_SERVICE_API_KEY || '';

  const aiProxyOptions: Options = {
    target: AI_SERVICE_URL,
    changeOrigin: true,
    pathFilter: '/api/ai',
    pathRewrite: { '^/api/ai': '/api' },
    on: {
      proxyReq: (proxyReq, req) => {
        // Inject AI service API key so the AI service can authenticate gateway calls
        if (AI_API_KEY) {
          proxyReq.setHeader('X-API-Key', AI_API_KEY);
        }
        console.log(`[gateway] → AI Service: ${req.method} ${req.url}`);
      },
      error: (err, _req, res) => {
        console.error(`[gateway] AI Service proxy error:`, err.message);
        (res as any).status(502).json({
          error: 'Bad Gateway',
          message: 'AI Service is unavailable. Please try again later.',
          service: 'ai-service',
        });
      },
    },
  };

  app.use(createProxyMiddleware(aiProxyOptions));

  // ─────────────────────────────────────────────────────────────
  //  2. /api/* → Backend Service (catch-all)
  //     Handles: auth, cases, drafts, users, library, documents
  //     Example: POST /api/auth/register → BACKEND_SERVICE_URL/api/auth/register
  // ─────────────────────────────────────────────────────────────
  const backendProxyOptions: Options = {
    target: BACKEND_SERVICE_URL,
    changeOrigin: true,
    pathFilter: '/api',
    on: {
      proxyReq: (_proxyReq, req) => {
        console.log(`[gateway] → Backend Service: ${req.method} ${req.url}`);
      },
      error: (err, _req, res) => {
        console.error(`[gateway] Backend Service proxy error:`, err.message);
        (res as any).status(502).json({
          error: 'Bad Gateway',
          message: 'Backend Service is unavailable. Please try again later.',
          service: 'backend-service',
        });
      },
    },
  };

  app.use(createProxyMiddleware(backendProxyOptions));

  // ─────────────────────────────────────────────────────────────
  //  3. /uploads/* → Backend Service (static files)
  //     Handles: avatars, uploaded documents
  // ─────────────────────────────────────────────────────────────
  app.use(createProxyMiddleware({
    target: BACKEND_SERVICE_URL,
    changeOrigin: true,
    pathFilter: '/uploads',
  }));
}
