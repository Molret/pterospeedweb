import { Redis } from '@upstash/redis';

/**
 * Upstash Redis client. Reads from UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN env vars (set in Vercel project settings).
 *
 * Falls back to null if env vars are missing — API handlers check this
 * and return a graceful error so local dev doesn't explode.
 */
export function getRedis(): Redis | null {
    const url = import.meta.env.UPSTASH_REDIS_REST_URL;
    const token = import.meta.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return null;
    return new Redis({ url, token });
}

export const REPORT_PREFIX = 'pterospeed:r:';
export const REPORT_TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days
