import { Express } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';

/**
 * Gateway Proxy Routing
 *
 * Route Map:
 *   /api/ai/*    →  AI Service   (http://localhost:5000)
 *   /api/*       →  Backend Svc  (http://localhost:4000)
 *
 * The order matters — /api/ai must be registered BEFORE the catch-all /api
 * so that AI requests are intercepted first.
 */
export function setupProxyRoutes(app: Express): void {
  const BACKEND_SERVICE_URL = process.env.BACKEND_SERVICE_URL || 'http://localhost:4000';
  const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';

  // ─────────────────────────────────────────────────────────────
  //  1. /api/ai/* → AI Service
  //     Handles: chat, analysis, drafting, suggestions
  //     Example: POST /api/ai/chat  →  AI_SERVICE_URL/api/ai/chat
  // ─────────────────────────────────────────────────────────────
  const aiProxyOptions: Options = {
    target: AI_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: undefined, // Keep path as-is: /api/ai/chat → /api/ai/chat
    on: {
      proxyReq: (_proxyReq, req) => {
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

  app.use('/api/ai', createProxyMiddleware(aiProxyOptions));

  // ─────────────────────────────────────────────────────────────
  //  2. /api/* → Backend Service (catch-all)
  //     Handles: cases, drafts, users, library, documents
  //     Example: GET /api/cases  →  BACKEND_SERVICE_URL/api/cases
  // ─────────────────────────────────────────────────────────────
  const backendProxyOptions: Options = {
    target: BACKEND_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: undefined, // Keep path as-is: /api/cases → /api/cases
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

  app.use('/api', createProxyMiddleware(backendProxyOptions));
}
