const hits = new Map<string, { count: number; resetAt: number }>();

if (typeof globalThis !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of hits) {
      if (val.resetAt < now) hits.delete(key);
    }
  }, 5 * 60 * 1000).unref?.();
}

export async function rateLimit(
  ip: string,
  action: string,
  limit: number,
  windowSec: number
): Promise<number | null> {
  const key = `${action}:${ip}`;
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return null;
  }

  if (entry.count >= limit) {
    return Math.ceil((entry.resetAt - now) / 1000);
  }

  entry.count++;
  return null;
}
