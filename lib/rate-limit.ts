// Small in-memory limiter for login attempts. Good enough for a single Render
// instance; use Redis or similar if you scale to multiple instances.
type Entry = { count: number; resetAt: number };
const buckets = new Map<string, Entry>();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) return false;
  return entry.count >= limit;
}

export function recordFailure(key: string, windowMs: number) {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) buckets.set(key, { count: 1, resetAt: now + windowMs });
  else entry.count += 1;
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
  }
}

export function clearFailures(key: string) {
  buckets.delete(key);
}
