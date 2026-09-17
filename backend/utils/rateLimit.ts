import { NextRequest, NextResponse } from "next/server";

type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const entries = new Map<string, RateLimitEntry>();

const getClientKey = (request: NextRequest): string => {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";
};

export const enforceRateLimit = (
  request: NextRequest,
  name: string,
  options: RateLimitOptions
): NextResponse | null => {
  const now = Date.now();
  const key = `${name}:${getClientKey(request)}`;
  const current = entries.get(key);

  if (entries.size > 1000) {
    entries.forEach((entry, entryKey) => {
      if (entry.resetAt <= now) entries.delete(entryKey);
    });
  }

  if (!current || current.resetAt <= now) {
    entries.set(key, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  if (current.count >= options.limit) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return NextResponse.json(
      { errMessage: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  current.count += 1;
  return null;
};
