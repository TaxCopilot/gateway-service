import { Request, Response, NextFunction } from 'express';

// 404 — Route not found (no matching proxy rule)
export function notFoundHandler(req: Request, res: Response, _next: NextFunction): void {
  res.status(404).json({
    error: 'Not Found',
    message: `Gateway has no route for ${req.method} ${req.originalUrl}`,
    statusCode: 404,
  });
}

// Global error handler
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[gateway-service] Error:', err.message);

  res.status(500).json({
    error: 'Internal Gateway Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
    statusCode: 500,
  });
}
