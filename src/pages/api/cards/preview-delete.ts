import type { APIRoute } from 'astro';
import { getCardBySlug, getCardsKV, PublishError } from '../../../lib/cards-store';
import { peekDeleteLink } from '../../../lib/delete-link';
import { enforceRateLimit, getClientIp, RateLimitError } from '../../../lib/rate-limit';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
    try {
        const body = await request.json();
        const token = typeof body?.token === 'string' ? body.token.trim() : '';

        if (!token) {
            return json({ error: 'Delete token is required' }, 400);
        }

        const kv = getCardsKV(locals);
        const ip = getClientIp(request);
        await enforceRateLimit(kv, 'preview-delete-ip', ip, 30, 3600);

        const pending = await peekDeleteLink(kv, token);
        if (!pending) {
            return json({ error: 'This delete link has expired or was already used' }, 403);
        }

        const record = await getCardBySlug(locals, pending.slug);
        if (!record) {
            return json({ error: 'Card not found' }, 404);
        }

        const cardEmail = record.cardData.email?.value?.toLowerCase().trim();
        if (!cardEmail || cardEmail !== pending.email) {
            return json({ error: 'Invalid delete link' }, 403);
        }

        return json({
            slug: record.slug,
            fullName: record.cardData.fullName,
            jobTitle: record.cardData.jobTitle
        });
    } catch (error) {
        if (error instanceof RateLimitError) {
            return json({ error: error.message }, error.status);
        }
        if (error instanceof PublishError) {
            return json({ error: error.message }, error.status);
        }
        console.error('Preview delete failed', error);
        return json({ error: 'Could not preview delete' }, 500);
    }
};

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}
