import { PublishError } from './cards-store';

const DELETE_PREFIX = 'delete:';
export const DELETE_LINK_TTL_SECONDS = 3600;

export interface DeleteLinkRecord {
    slug: string;
    email: string;
    createdAt: string;
}

export async function createDeleteLink(
    kv: KVNamespace,
    slug: string,
    email: string
): Promise<string> {
    const token = crypto.randomUUID();
    const record: DeleteLinkRecord = {
        slug,
        email: email.toLowerCase().trim(),
        createdAt: new Date().toISOString()
    };
    await kv.put(`${DELETE_PREFIX}${token}`, JSON.stringify(record), {
        expirationTtl: DELETE_LINK_TTL_SECONDS
    });
    return token;
}

export async function peekDeleteLink(kv: KVNamespace, token: string): Promise<DeleteLinkRecord | null> {
    return kv.get<DeleteLinkRecord>(`${DELETE_PREFIX}${token.trim()}`, 'json');
}

export async function consumeDeleteLink(kv: KVNamespace, token: string): Promise<DeleteLinkRecord> {
    const key = `${DELETE_PREFIX}${token.trim()}`;
    const record = await kv.get<DeleteLinkRecord>(key, 'json');
    if (!record) {
        throw new PublishError('This delete link has expired or was already used', 403);
    }

    await kv.delete(key);
    return record;
}
