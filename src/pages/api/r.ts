import type { APIRoute } from 'astro';
import { customAlphabet } from 'nanoid';
import { getRedis, REPORT_PREFIX, REPORT_TTL_SECONDS } from '../../lib/store';

export const prerender = false;

// 6-char URL-safe ID using a 62-char alphabet (~56 billion combos — plenty).
const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);

const MAX_BODY_BYTES = 256 * 1024; // 256 KB hard cap on report size
const ORIGIN = 'https://pterospeed.me';

function json(status: number, body: unknown) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'content-type': 'application/json',
            'access-control-allow-origin': '*',
            'access-control-allow-headers': 'content-type',
            'access-control-allow-methods': 'POST, OPTIONS',
        },
    });
}

export const OPTIONS: APIRoute = () =>
    new Response(null, {
        status: 204,
        headers: {
            'access-control-allow-origin': '*',
            'access-control-allow-headers': 'content-type',
            'access-control-allow-methods': 'POST, OPTIONS',
        },
    });

export const POST: APIRoute = async ({ request }) => {
    const redis = getRedis();
    if (!redis) {
        return json(503, { error: 'shortener_unavailable' });
    }

    let raw: string;
    try {
        raw = await request.text();
    } catch {
        return json(400, { error: 'invalid_body' });
    }

    if (raw.length > MAX_BODY_BYTES) {
        return json(413, { error: 'payload_too_large' });
    }

    let body: any;
    try {
        body = JSON.parse(raw);
    } catch {
        return json(400, { error: 'invalid_json' });
    }

    const data = body?.data;
    if (!data || typeof data !== 'object' || data.v !== 1) {
        return json(400, { error: 'invalid_report' });
    }

    // Retry a few times on the astronomically-unlikely ID collision.
    let id = '';
    for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = nanoid();
        const set = await redis.set(`${REPORT_PREFIX}${candidate}`, data, {
            ex: REPORT_TTL_SECONDS,
            nx: true,
        });
        if (set === 'OK') {
            id = candidate;
            break;
        }
    }

    if (!id) {
        return json(500, { error: 'id_generation_failed' });
    }

    return json(200, {
        id,
        url: `${ORIGIN}/r/${id}`,
    });
};
