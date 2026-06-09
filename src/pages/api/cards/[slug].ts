import type { APIRoute } from 'astro';
import { getCardBySlug } from '../../../lib/cards-store';

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

    return json({
        slug: record.slug,
        editKey: record.editKey,
        templateId: record.templateId,
        cardData: record.cardData,
        publishedAt: record.publishedAt,
        updatedAt: record.updatedAt
    });
};

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}
