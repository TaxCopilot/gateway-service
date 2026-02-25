import { Request, Response, NextFunction } from 'express';

// Simple in-memory rate limiter for the gateway
const requestCounts = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 60 * 1000;  // 1 minute window
const MAX_REQUESTS = 100;      // max 100 requests per window per IP

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  const entry = requestCounts.get(ip);

  if (!entry || now > entry.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    next();
    return;
  }

  if (entry.count >= MAX_REQUESTS) {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    });
    return;
  }

  entry.count++;
  next();
}
