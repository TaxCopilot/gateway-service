import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Per-user (or per-IP when unauthenticated) rate limiter.
 * Uses userId from JWT when available; falls back to IP.
 * Limit: 100 requests per minute per user (per requirements).
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 100;

function getRateLimitKey(req: Request): string {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  const secret = process.env.JWT_SECRET;

  if (token && secret) {
    try {
      const decoded = jwt.verify(token, secret) as { userId?: string };
      if (decoded?.userId) return `user:${decoded.userId}`;
    } catch {
      // Invalid or expired token – fall back to IP
    }
  }

  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  return `ip:${ip}`;
}

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const key = getRateLimitKey(req);
  const now = Date.now();

  const entry = requestCounts.get(key);

  if (!entry || now > entry.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + WINDOW_MS });
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
