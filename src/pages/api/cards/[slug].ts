import type { APIRoute } from 'astro';
import { buildCardUrls, getCardBySlug } from '../../../lib/cards-store';
import { getPublicOrigin } from '../../../lib/site-url';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals, url }) => {
    const slug = params.slug;
    if (!slug) {
        return json({ error: 'Slug is required' }, 400);
    }

    const record = await getCardBySlug(locals, slug);
    if (!record) {
        return json({ error: 'Card not found' }, 404);
    }

    const editKey = url.searchParams.get('key');
    if (!editKey || editKey !== record.editKey) {
        return json({ error: 'Invalid edit key' }, 403);
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
};

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}
