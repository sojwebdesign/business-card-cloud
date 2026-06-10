import type { APIRoute } from 'astro';
import { buildCardUrls, getCardBySlug, getCardsKV, PublishError } from '../../../lib/cards-store';
import { consumeMagicLink } from '../../../lib/magic-link';
import { enforceRateLimit, getClientIp, RateLimitError } from '../../../lib/rate-limit';
import { getPublicOrigin } from '../../../lib/site-url';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, url }) => {
    try {
        const body = await request.json();
        const token = typeof body?.token === 'string' ? body.token.trim() : '';

        if (!token) {
            return json({ error: 'Edit token is required' }, 400);
        }

        const kv = getCardsKV(locals);
        const ip = getClientIp(request);
        await enforceRateLimit(kv, 'verify-magic-ip', ip, 30, 3600);

        const magic = await consumeMagicLink(kv, token);
        const record = await getCardBySlug(locals, magic.slug);
        if (!record) {
            return json({ error: 'Card not found' }, 404);
        }

        const cardEmail = record.cardData.email?.value?.toLowerCase().trim();
        if (!cardEmail || cardEmail !== magic.email) {
            return json({ error: 'Invalid edit link' }, 403);
        }

        const origin = getPublicOrigin(url.origin, locals);
        const urls = buildCardUrls(origin, record.slug, record.editKey);

        return json({
            slug: record.slug,
            editKey: record.editKey,
            templateId: record.templateId,
            cardData: record.cardData,
            publishedAt: record.publishedAt,
            updatedAt: record.updatedAt,
            ...urls
        });
    } catch (error) {
        if (error instanceof RateLimitError) {
            return json({ error: error.message }, error.status);
        }
        if (error instanceof PublishError) {
            return json({ error: error.message }, error.status);
        }
        console.error('Verify magic link failed', error);
        return json({ error: 'Could not verify edit link' }, 500);
    }
};

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}
