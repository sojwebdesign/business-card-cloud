import { PublishError } from './cards-store';

const MAGIC_PREFIX = 'magic:';
export const MAGIC_LINK_TTL_SECONDS = 3600;

export interface MagicLinkRecord {
    slug: string;
    email: string;
    createdAt: string;
}

export async function createMagicLink(
    kv: KVNamespace,
    slug: string,
    email: string
): Promise<string> {
    const token = crypto.randomUUID();
    const record: MagicLinkRecord = {
        slug,
        email: email.toLowerCase().trim(),
        createdAt: new Date().toISOString()
    };
    await kv.put(`${MAGIC_PREFIX}${token}`, JSON.stringify(record), {
        expirationTtl: MAGIC_LINK_TTL_SECONDS
    });
    return token;
}

export async function consumeMagicLink(kv: KVNamespace, token: string): Promise<MagicLinkRecord> {
    const key = `${MAGIC_PREFIX}${token.trim()}`;
    const record = await kv.get<MagicLinkRecord>(key, 'json');
    if (!record) {
        throw new PublishError('This edit link has expired or was already used', 403);
    }

    await kv.delete(key);
    return record;
}
