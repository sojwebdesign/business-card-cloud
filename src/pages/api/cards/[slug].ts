import type { APIRoute } from 'astro';
import { buildCardUrls, deleteCard, getCardBySlug, PublishError } from '../../../lib/cards-store';
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

export const DELETE: APIRoute = async ({ params, locals, url }) => {
    const slug = params.slug;
    if (!slug) {
        return json({ error: 'Slug is required' }, 400);
    }

    const editKey = url.searchParams.get('key');
    if (!editKey) {
        return json({ error: 'Edit key is required' }, 400);
    }

    try {
        await deleteCard(locals, slug, editKey);
        return json({ ok: true });
    } catch (error) {
        if (error instanceof PublishError) {
            return json({ error: error.message }, error.status);
        }
        console.error('Delete failed', error);
        return json({ error: 'Failed to delete card' }, 500);
    }
};

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}
