import type { PublishedCard, CardData } from './types';
import { resolveUniqueSlug } from './slug';
import { isReservedSlug } from './reserved-slugs';

const KV_PREFIX = 'card:';

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

export function sanitizeCardData(cardData: CardData): CardData {
    const cleaned = structuredClone(cardData);
    delete cleaned.photoSourceUrl;
    return cleaned;
}

export async function getCardBySlug(locals: App.Locals, slug: string): Promise<PublishedCard | null> {
    const kv = getCardsKV(locals);
    return kv.get<PublishedCard>(kvKey(slug), 'json');
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
    return { record, updated: false };
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
        /** Owner page — card + QR, add to Home Screen */
        shareUrl: `${base}/${slug}/share`,
        /** Prospect page — card + Save to Contacts (QR target) */
        contactUrl: `${base}/${slug}`,
        editUrl: `${base}/?edit=${slug}&key=${editKey}`,
        vcfUrl: `${base}/${slug}.vcf`
    };
}
