import type { APIRoute } from 'astro';
import { getCardBySlug, getCardsKV, PublishError } from '../../../../lib/cards-store';
import { requireAdminKey } from '../../../../lib/admin-auth';
import { sendEditLinkEmail } from '../../../../lib/edit-link-email';
import { createMagicLink } from '../../../../lib/magic-link';
import { getPublicOrigin } from '../../../../lib/site-url';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, url }) => {
    try {
        const body = await request.json();
        requireAdminKey(locals, request, body);

        const slug = typeof body?.slug === 'string' ? body.slug.trim() : '';
        if (!slug) {
            return json({ error: 'Slug is required' }, 400);
        }

        const card = await getCardBySlug(locals, slug);
        if (!card) {
            return json({ error: 'Card not found' }, 404);
        }

        const email = card.cardData.email?.value?.toLowerCase().trim();
        if (!email) {
            return json({ error: 'This card has no email address' }, 400);
        }

        const kv = getCardsKV(locals);
        const token = await createMagicLink(kv, slug, email);
        const env = locals.runtime?.env as import('../../../../lib/email-env').EmailEnv;
        const origin = getPublicOrigin(url.origin, locals);

        await sendEditLinkEmail(env, origin, email, [{
            fullName: card.cardData.fullName,
            token
        }]);

        return json({
            ok: true,
            email,
            message: `Edit link sent to ${email}`
        });
    } catch (error) {
        if (error instanceof PublishError) {
            return json({ error: error.message }, error.status);
        }
        console.error('Admin send edit link failed', error);
        return json({ error: 'Could not send edit link' }, 500);
    }
};

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}
