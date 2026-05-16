/**
 * IN-MEMORY RATE LIMITER (best-effort)
 *
 * Limits each client IP to a fixed number of requests per rolling window.
 * State lives in the Node process, so it holds across requests served by
 * a warm serverless instance and resets on a cold start. For a low-traffic
 * portfolio that is enough to stop casual spam and form abuse.
 *
 * For hard guarantees across all instances, swap this for a Redis-backed
 * limiter (e.g. @upstash/ratelimit).
 */

type Hit = { count: number; resetAt: number };

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 5;

// Reused across invocations on a warm instance.
const hits = new Map<string, Hit>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const existing = hits.get(key);

  if (!existing || now >= existing.resetAt) {
    const fresh: Hit = { count: 1, resetAt: now + WINDOW_MS };
    hits.set(key, fresh);
    pruneExpired(now);
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt: fresh.resetAt };
  }

  existing.count += 1;
  const allowed = existing.count <= MAX_REQUESTS;
  return {
    allowed,
    remaining: Math.max(0, MAX_REQUESTS - existing.count),
    resetAt: existing.resetAt,
  };
}

/** Drop expired entries so the map doesn't grow unbounded. */
function pruneExpired(now: number): void {
  for (const [key, hit] of hits) {
    if (now >= hit.resetAt) hits.delete(key);
  }
}
