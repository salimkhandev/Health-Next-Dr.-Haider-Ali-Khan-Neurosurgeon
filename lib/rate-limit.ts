import { NextRequest } from 'next/server';

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

// Global in-memory storage to survive hot-reloads during dev/production runtimes on VPS
const tracker = (global as any)._rateLimitTracker || new Map<string, RateLimitInfo>();
if (!(global as any)._rateLimitTracker) {
  (global as any)._rateLimitTracker = tracker;
}

/**
 * Simple IP-based sliding window rate limiter.
 * @param req The incoming request
 * @param limit Max allowed requests within the window
 * @param windowMs Time window in milliseconds
 * @returns { success: boolean, headers: HeadersInit }
 */
export function rateLimit(
  req: NextRequest,
  limit = 20,
  windowMs = 60000
): { success: boolean; headers: HeadersInit } {
  // Try to retrieve real IP address
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  const route = req.nextUrl.pathname;
  const key = `${ip}:${route}`;

  const now = Date.now();
  const info = tracker.get(key);

  if (!info) {
    tracker.set(key, { count: 1, resetTime: now + windowMs });
    return {
      success: true,
      headers: {
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': String(limit - 1),
        'X-RateLimit-Reset': String(now + windowMs),
      },
    };
  }

  if (now > info.resetTime) {
    // Window expired, reset window
    info.count = 1;
    info.resetTime = now + windowMs;
    tracker.set(key, info);

    return {
      success: true,
      headers: {
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': String(limit - 1),
        'X-RateLimit-Reset': String(now + windowMs),
      },
    };
  }

  if (info.count >= limit) {
    // Limit exceeded
    return {
      success: false,
      headers: {
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(info.resetTime),
        'Retry-After': String(Math.ceil((info.resetTime - now) / 1000)),
      },
    };
  }

  // Under limit
  info.count += 1;
  tracker.set(key, info);

  return {
    success: true,
    headers: {
      'X-RateLimit-Limit': String(limit),
      'X-RateLimit-Remaining': String(limit - info.count),
      'X-RateLimit-Reset': String(info.resetTime),
    },
  };
}
