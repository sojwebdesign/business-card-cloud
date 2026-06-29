import type { APIRoute } from 'astro';
import { buildCardUrls, findCardsByEmail, previewNewCardSlug } from '../../../lib/cards-store';
import { allowedEmailError, isAllowedWorkEmail } from '../../../lib/allowed-email';
import { getTemplateLabel } from '../../../lib/template-labels';
import { getPublicOrigin } from '../../../lib/site-url';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, url }) => {
    try {
        const body = await request.json();
        const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
        const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : '';
        const excludeSlug = typeof body?.excludeSlug === 'string' ? body.excludeSlug.trim() : '';

        if (!email || !email.includes('@')) {
            return json({ error: 'A valid email is required' }, 400);
        }
        if (!isAllowedWorkEmail(email)) {
            return json({ error: allowedEmailError() }, 400);
        }
        if (!fullName) {
            return json({ error: 'Full name is required' }, 400);
        }

        let cards = await findCardsByEmail(locals, email);
        if (excludeSlug) {
            cards = cards.filter((card) => card.slug !== excludeSlug);
        }

        const proposedSlug = await previewNewCardSlug(locals, fullName, excludeSlug || undefined);
        const origin = getPublicOrigin(url.origin, locals);
        const proposedUrls = buildCardUrls(origin, proposedSlug, 'preview');

        return json({
            hasExisting: cards.length > 0,
            cards: cards.map((card) => ({
                slug: card.slug,
                fullName: card.cardData.fullName,
                jobTitle: card.cardData.jobTitle,
                templateId: card.templateId,
                templateLabel: getTemplateLabel(card.templateId),
                updatedAt: card.updatedAt,
                contactUrl: buildCardUrls(origin, card.slug, card.editKey).contactUrl
            })),
            proposedSlug,
            proposedContactUrl: proposedUrls.contactUrl
        });
    } catch (error) {
        console.error('Check email failed', error);
        return json({ error: 'Could not check email' }, 500);
    }
};

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}
