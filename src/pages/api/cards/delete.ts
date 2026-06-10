import type { APIRoute } from 'astro';
import { deleteCard, PublishError } from '../../../lib/cards-store';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
    try {
        const body = await request.json();
        const slug = typeof body?.slug === 'string' ? body.slug.trim() : '';
        const editKey = typeof body?.editKey === 'string' ? body.editKey.trim() : '';

        if (!slug) {
            return json({ error: 'Slug is required' }, 400);
        }
        if (!editKey) {
            return json({ error: 'Edit key is required' }, 400);
        }

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
