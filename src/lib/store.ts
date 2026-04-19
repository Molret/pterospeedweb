import { Redis } from '@upstash/redis';

/**
 * Redis.fromEnv() auto-detects Vercel KV env vars in this order:
 *   1. UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 *   2. KV_REST_API_URL + KV_REST_API_TOKEN  (Vercel KV / Upstash marketplace)
 *
 * Returns null when running locally without env vars so dev doesn't crash.
 */
export function getRedis(): Redis | null {
    const url =
        import.meta.env.KV_REST_API_URL ??
        import.meta.env.UPSTASH_REDIS_REST_URL;
    const token =
        import.meta.env.KV_REST_API_TOKEN ??
        import.meta.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) return null;
    return new Redis({ url, token });
}

export const REPORT_PREFIX = 'pterospeed:r:';
export const REPORT_TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days
