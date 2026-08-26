// ====================================================================
// Lighthouse TaskFlow v2.1 — Sliding-Window Memory Rate Limiter (P1-2)
// Protects endpoints against abuse, spam, and DDoS in development & production
// ====================================================================

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes to prevent memory leak
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    rateLimitMap.forEach((record, key) => {
      record.timestamps = record.timestamps.filter((ts: number) => now - ts < 60000);
      if (record.timestamps.length === 0) {
        rateLimitMap.delete(key);
      }
    });
  }, 300000);
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds?: number;
}

/**
 * Checks rate limit for a key (e.g. IP + endpoint)
 * @param key Unique identifier (e.g., `ip:endpoint` or `userId:endpoint`)
 * @param maxRequests Maximum requests allowed within the window
 * @param windowSeconds Duration of window in seconds (default: 60s)
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds = 60
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  const record = rateLimitMap.get(key) || { timestamps: [] };

  // Filter timestamps within current window
  const validTimestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (validTimestamps.length >= maxRequests) {
    const oldestTimestamp = validTimestamps[0];
    const retryAfterMs = oldestTimestamp + windowMs - now;
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));

    return {
      allowed: false,
      limit: maxRequests,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  // Record this request
  validTimestamps.push(now);
  rateLimitMap.set(key, { timestamps: validTimestamps });

  return {
    allowed: true,
    limit: maxRequests,
    remaining: maxRequests - validTimestamps.length,
  };
}

/**
 * Extracts client IP safely from Next.js request headers
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}
