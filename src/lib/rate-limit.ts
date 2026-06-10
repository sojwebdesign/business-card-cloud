const RATE_PREFIX = 'rate:';

export class RateLimitError extends Error {
    status: number;

    constructor(message = 'Too many requests. Try again in a few minutes.') {
        super(message);
        this.name = 'RateLimitError';
        this.status = 429;
    }
}

interface RateRecord {
    count: number;
    resetAt: number;
}

export async function enforceRateLimit(
    kv: KVNamespace,
    action: string,
    identifier: string,
    max: number,
    windowSeconds: number
): Promise<void> {
    const key = `${RATE_PREFIX}${action}:${identifier}`;
    const now = Date.now();
    const record = await kv.get<RateRecord>(key, 'json');

    if (!record || now > record.resetAt) {
        await kv.put(key, JSON.stringify({ count: 1, resetAt: now + windowSeconds * 1000 }), {
            expirationTtl: windowSeconds
        });
        return;
    }

    if (record.count >= max) {
        throw new RateLimitError();
    }

    const ttl = Math.max(60, Math.ceil((record.resetAt - now) / 1000));
    await kv.put(key, JSON.stringify({ count: record.count + 1, resetAt: record.resetAt }), {
        expirationTtl: ttl
    });
}

export function getClientIp(request: Request): string {
    return (
        request.headers.get('CF-Connecting-IP')
        || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
        || 'unknown'
    );
}
