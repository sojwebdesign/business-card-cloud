import type { PublishedCard, CardData } from './types';
import { resolveUniqueSlug } from './slug';
import { isReservedSlug } from './reserved-slugs';

const KV_PREFIX = 'card:';
const EMAIL_INDEX_PREFIX = 'email-index:';

export function getCardsKV(locals: App.Locals) {
    const env = locals.runtime?.env as { CARDS?: KVNamespace } | undefined;
    if (!env?.CARDS) {
        throw new Error('CARDS KV binding is not configured');
    }
    return env.CARDS;
}

function kvKey(slug: string): string {
    return `${KV_PREFIX}${slug}`;
}

function emailIndexKey(email: string): string {
    return `${EMAIL_INDEX_PREFIX}${email.toLowerCase().trim()}`;
}

export function sanitizeCardData(cardData: CardData): CardData {
    const cleaned = structuredClone(cardData);
    delete cleaned.photoSourceUrl;
    return cleaned;
}

export async function getCardBySlug(locals: App.Locals, slug: string): Promise<PublishedCard | null> {
    const kv = getCardsKV(locals);
    return kv.get<PublishedCard>(kvKey(slug), 'json');
}

async function getEmailSlugs(kv: KVNamespace, email: string): Promise<string[]> {
    const slugs = await kv.get<string[]>(emailIndexKey(email), 'json');
    return slugs || [];
}

async function syncEmailIndex(
    kv: KVNamespace,
    email: string,
    slug: string,
    previousEmail?: string
) {
    const normalized = email.toLowerCase().trim();
    if (!normalized) return;

    if (previousEmail && previousEmail.toLowerCase().trim() !== normalized) {
        const prevSlugs = await getEmailSlugs(kv, previousEmail);
        const filtered = prevSlugs.filter((s) => s !== slug);
        if (filtered.length) {
            await kv.put(emailIndexKey(previousEmail), JSON.stringify(filtered));
        } else {
            await kv.delete(emailIndexKey(previousEmail));
        }
    }

    const slugs = await getEmailSlugs(kv, normalized);
    if (!slugs.includes(slug)) {
        await kv.put(emailIndexKey(normalized), JSON.stringify([...slugs, slug]));
    }
}

async function removeFromEmailIndex(kv: KVNamespace, email: string, slug: string) {
    const normalized = email.toLowerCase().trim();
    if (!normalized) return;

    const slugs = await getEmailSlugs(kv, normalized);
    const filtered = slugs.filter((s) => s !== slug);
    if (filtered.length) {
        await kv.put(emailIndexKey(normalized), JSON.stringify(filtered));
    } else {
        await kv.delete(emailIndexKey(normalized));
    }
}

export async function findCardsByEmail(locals: App.Locals, email: string): Promise<PublishedCard[]> {
    const kv = getCardsKV(locals);
    const normalized = email.toLowerCase().trim();
    let slugs = await getEmailSlugs(kv, normalized);

    if (!slugs.length) {
        const { keys } = await kv.list({ prefix: KV_PREFIX });
        for (const key of keys) {
            const card = await kv.get<PublishedCard>(key.name, 'json');
            if (card?.cardData?.email?.value?.toLowerCase().trim() === normalized) {
                slugs.push(card.slug);
                await syncEmailIndex(kv, normalized, card.slug);
            }
        }
    }

    const cards: PublishedCard[] = [];
    for (const slug of [...new Set(slugs)]) {
        const card = await getCardBySlug(locals, slug);
        if (card) cards.push(card);
    }

    return cards.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function saveCard(
    locals: App.Locals,
    input: {
        cardData: CardData;
        templateId: string;
        slug?: string;
        editKey?: string;
    }
): Promise<{ record: PublishedCard; updated: boolean }> {
    const kv = getCardsKV(locals);
    const now = new Date().toISOString();
    const cardData = sanitizeCardData(input.cardData);

    if (input.slug && input.editKey) {
        const existing = await getCardBySlug(locals, input.slug);
        if (!existing || existing.editKey !== input.editKey) {
            throw new PublishError('Invalid edit credentials', 403);
        }

        const record: PublishedCard = {
            ...existing,
            templateId: input.templateId,
            cardData,
            updatedAt: now
        };
        await kv.put(kvKey(record.slug), JSON.stringify(record));
        await syncEmailIndex(
            kv,
            cardData.email?.value || '',
            record.slug,
            existing.cardData.email?.value
        );
        return { record, updated: true };
    }

    const slug = await resolveUniqueSlug(
        input.slug || cardData.fullName,
        async (candidate) => !isReservedSlug(candidate) && !(await kv.get(kvKey(candidate)))
    );

    if (isReservedSlug(slug)) {
        throw new PublishError('This URL slug is reserved', 400);
    }

    const record: PublishedCard = {
        slug,
        editKey: crypto.randomUUID(),
        templateId: input.templateId,
        cardData,
        publishedAt: now,
        updatedAt: now
    };

    await kv.put(kvKey(slug), JSON.stringify(record));
    await syncEmailIndex(kv, cardData.email?.value || '', slug);
    return { record, updated: false };
}

export async function deleteCard(
    locals: App.Locals,
    slug: string,
    editKey: string
): Promise<void> {
    const existing = await getCardBySlug(locals, slug);
    if (!existing || existing.editKey !== editKey) {
        throw new PublishError('Invalid edit credentials', 403);
    }

    const kv = getCardsKV(locals);
    await kv.delete(kvKey(slug));
    await removeFromEmailIndex(kv, existing.cardData.email?.value || '', slug);
}

export class PublishError extends Error {
    status: number;

    constructor(message: string, status = 400) {
        super(message);
        this.name = 'PublishError';
        this.status = status;
    }
}

export function buildCardUrls(origin: string, slug: string, editKey: string) {
    const base = `${origin}/business-card`;
    return {
        shareUrl: `${base}/${slug}/share`,
        contactUrl: `${base}/${slug}`,
        editUrl: `${base}/?edit=${slug}&key=${editKey}`,
        vcfUrl: `${base}/${slug}.vcf`,
        photoUrl: `${base}/${slug}/photo`
    };
}
