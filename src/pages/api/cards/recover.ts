import type { APIRoute } from 'astro';
import { buildCardUrls, findCardsByEmail } from '../../../lib/cards-store';
import { getPublicOrigin } from '../../../lib/site-url';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, url }) => {
    try {
        const body = await request.json();
        const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

        if (!email || !email.includes('@')) {
            return json({ error: 'A valid email is required' }, 400);
        }

        const cards = await findCardsByEmail(locals, email);
        if (!cards.length) {
            return json({ error: 'No cards found for this email' }, 404);
        }

        const origin = getPublicOrigin(url.origin, locals);

        return json({
            cards: cards.map((card) => ({
                slug: card.slug,
                editKey: card.editKey,
                fullName: card.cardData.fullName,
                jobTitle: card.cardData.jobTitle,
                updatedAt: card.updatedAt,
                ...buildCardUrls(origin, card.slug, card.editKey)
            }))
        });
    } catch (error) {
        console.error('Recover failed', error);
        return json({ error: 'Could not look up cards' }, 500);
    }
};

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}
