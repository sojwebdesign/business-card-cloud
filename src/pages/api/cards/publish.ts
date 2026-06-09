import type { APIRoute } from 'astro';
import {
    buildCardUrls,
    PublishError,
    saveCard
} from '../../../lib/cards-store';
import type { CardData } from '../../../lib/types';

export const prerender = false;

function validateCardData(cardData: CardData): string | null {
    if (!cardData?.fullName?.trim()) return 'Full name is required';
    if (!cardData?.jobTitle?.trim()) return 'Job title is required';
    if (!cardData?.email?.value?.trim()) return 'Email is required';
    return null;
}

export const POST: APIRoute = async ({ request, locals, url }) => {
    try {
        const body = await request.json();
        const cardData = body?.cardData as CardData | undefined;
        const templateId = (body?.templateId as string) || cardData?.templateId || 'sojern';
        const slug = typeof body?.slug === 'string' ? body.slug.trim() : undefined;
        const editKey = typeof body?.editKey === 'string' ? body.editKey.trim() : undefined;

        if (!cardData) {
            return json({ error: 'cardData is required' }, 400);
        }

        const validationError = validateCardData(cardData);
        if (validationError) {
            return json({ error: validationError }, 400);
        }

        const { record, updated } = await saveCard(locals, {
            cardData,
            templateId,
            slug,
            editKey
        });

        const urls = buildCardUrls(url.origin, record.slug, record.editKey);

        return json({
            slug: record.slug,
            editKey: record.editKey,
            ...urls,
            updated
        });
    } catch (error) {
        if (error instanceof PublishError) {
            return json({ error: error.message }, error.status);
        }
        console.error('Publish failed', error);
        return json({ error: 'Failed to publish card' }, 500);
    }
};

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}
