import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;
const REDIS_WARN_INTERVAL_MS = 60_000;

interface RedisCache {
    client: Redis | null;
    connectPromise: Promise<Redis | null> | null;
    lastWarnAt: number;
}

declare global {
    // eslint-disable-next-line no-var
    var _redisCache: RedisCache | undefined;
}

const cache: RedisCache = global._redisCache ?? {
    client: null,
    connectPromise: null,
    lastWarnAt: 0,
};

global._redisCache = cache;

function warnThrottled(message: string, error?: unknown) {
    const now = Date.now();
    if (now - cache.lastWarnAt < REDIS_WARN_INTERVAL_MS) {
        return;
    }

    cache.lastWarnAt = now;
    if (error) {
        console.warn(message, error);
    } else {
        console.warn(message);
    }
}

async function connectRedis(): Promise<Redis | null> {
    if (!REDIS_URL) {
        return null;
    }

    const client = new Redis(REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        connectTimeout: 2_000,
    });

    client.on('error', (error) => {
        warnThrottled('[redis] client error; rate limiter may use fallback', error);
    });

    try {
        await client.connect();
        return client;
    } catch (error) {
        warnThrottled('[redis] connect failed; rate limiter using fallback', error);
        client.disconnect();
        return null;
    }
}

export async function getRedisClient(): Promise<Redis | null> {
    if (cache.client && cache.client.status === 'ready') {
        return cache.client;
    }

    if (!cache.connectPromise) {
        cache.connectPromise = connectRedis().finally(() => {
            cache.connectPromise = null;
        });
    }

    const client = await cache.connectPromise;
    if (!client) {
        return null;
    }

    cache.client = client;
    return cache.client;
}
