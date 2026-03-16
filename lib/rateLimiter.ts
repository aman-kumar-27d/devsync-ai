import { NextRequest } from 'next/server';
import { getRedisClient } from '@/lib/redis';

interface FallbackEntry {
    count: number;
    resetAt: number;
}

interface RateLimitCheckInput {
    key: string;
    limit: number;
    windowSeconds: number;
}

interface RateLimitCheckResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    backend: 'redis' | 'fallback';
}

const fallbackMap = new Map<string, FallbackEntry>();
const FALLBACK_PRUNE_INTERVAL_MS = 5 * 60_000;
let lastFallbackPruneAt = 0;

function pruneFallback(now: number) {
    if (now - lastFallbackPruneAt < FALLBACK_PRUNE_INTERVAL_MS) {
        return;
    }

    fallbackMap.forEach((entry, key) => {
        if (now > entry.resetAt) {
            fallbackMap.delete(key);
        }
    });

    lastFallbackPruneAt = now;
}

function checkFallback(input: RateLimitCheckInput): RateLimitCheckResult {
    const now = Date.now();
    const windowMs = input.windowSeconds * 1000;
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const resetAt = windowStart + windowMs;
    const scopedKey = `fallback:${input.key}:${windowStart}`;

    pruneFallback(now);

    const entry = fallbackMap.get(scopedKey);
    if (!entry) {
        fallbackMap.set(scopedKey, { count: 1, resetAt });
        return {
            allowed: true,
            remaining: Math.max(0, input.limit - 1),
            resetAt,
            backend: 'fallback',
        };
    }

    entry.count += 1;
    const allowed = entry.count <= input.limit;

    return {
        allowed,
        remaining: Math.max(0, input.limit - entry.count),
        resetAt,
        backend: 'fallback',
    };
}

export async function checkRateLimit(input: RateLimitCheckInput): Promise<RateLimitCheckResult> {
    try {
        const redis = await getRedisClient();
        if (!redis) {
            return checkFallback(input);
        }

        const nowSeconds = Math.floor(Date.now() / 1000);
        const windowStart = Math.floor(nowSeconds / input.windowSeconds) * input.windowSeconds;
        const resetAt = (windowStart + input.windowSeconds) * 1000;
        const scopedKey = `rl:${input.key}:${windowStart}`;

        const result = await redis.multi().incr(scopedKey).expire(scopedKey, input.windowSeconds + 1).exec();
        const count = Number(result?.[0]?.[1] ?? 0);
        const allowed = count <= input.limit;

        return {
            allowed,
            remaining: Math.max(0, input.limit - count),
            resetAt,
            backend: 'redis',
        };
    } catch (error) {
        console.warn('[rateLimiter] redis unavailable, using fallback', error);
        return checkFallback(input);
    }
}

function normalizeKey(raw: string): string {
    return raw.trim().toLowerCase().replace(/[^a-z0-9:_-]+/g, '_').slice(0, 200) || 'unknown';
}

export function getRequestIp(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
        const first = forwarded.split(',')[0];
        if (first) return normalizeKey(first);
    }

    const realIp = req.headers.get('x-real-ip');
    if (realIp) {
        return normalizeKey(realIp);
    }

    return 'ip_unknown';
}

export function buildRateLimitKey(scope: string, subject: string): string {
    return `${normalizeKey(scope)}:${normalizeKey(subject)}`;
}
