import type { APIRoute } from 'astro';
import { findCardsByEmail, getCardsKV, PublishError } from '../../../lib/cards-store';
import { sendEditLinkEmail } from '../../../lib/edit-link-email';
import { createMagicLink } from '../../../lib/magic-link';
import { enforceRateLimit, getClientIp, RateLimitError } from '../../../lib/rate-limit';
import { getPublicOrigin } from '../../../lib/site-url';

export const prerender = false;

const GENERIC_MESSAGE = "If a card exists for this email, we've sent edit instructions.";

export const POST: APIRoute = async ({ request, locals, url }) => {
    try {
        const body = await request.json();
        const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
        const slug = typeof body?.slug === 'string' ? body.slug.trim() : '';

        if (!email || !email.includes('@')) {
            return json({ error: 'A valid email is required' }, 400);
        }

        const kv = getCardsKV(locals);
        const ip = getClientIp(request);
        await enforceRateLimit(kv, 'request-edit-email', email, 5, 3600);
        await enforceRateLimit(kv, 'request-edit-ip', ip, 20, 3600);

        let cards = await findCardsByEmail(locals, email);
        if (slug) {
            cards = cards.filter((card) => card.slug === slug);
        }

        if (cards.length) {
            const env = locals.runtime?.env as {
                RESEND_API_KEY?: string;
                EDIT_LINK_EMAIL_FROM?: string;
            };
            const origin = getPublicOrigin(url.origin, locals);
            const payload = [];

            for (const card of cards) {
                const token = await createMagicLink(kv, card.slug, email);
                payload.push({
                    fullName: card.cardData.fullName,
                    token
                });
            }

            await sendEditLinkEmail(env, origin, email, payload);
        }

        return json({ ok: true, message: GENERIC_MESSAGE });
    } catch (error) {
        if (error instanceof RateLimitError) {
            return json({ error: error.message }, error.status);
        }
        if (error instanceof PublishError) {
            return json({ error: error.message }, error.status);
        }
        console.error('Request edit link failed', error);
        return json({ ok: true, message: GENERIC_MESSAGE });
    }
};

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}
