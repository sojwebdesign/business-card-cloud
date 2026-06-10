import type { APIRoute } from 'astro';
import { PublishError, rotateEditKey } from '../../../lib/cards-store';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
    try {
        const body = await request.json();
        const slug = typeof body?.slug === 'string' ? body.slug.trim() : '';
        const editKey = typeof body?.editKey === 'string' ? body.editKey.trim() : '';

        if (!slug || !editKey) {
            return json({ error: 'Slug and edit key are required' }, 400);
        }

        const newEditKey = await rotateEditKey(locals, slug, editKey);
        return json({ ok: true, editKey: newEditKey });
    } catch (error) {
        if (error instanceof PublishError) {
            return json({ error: error.message }, error.status);
        }
        console.error('Rotate edit key failed', error);
        return json({ error: 'Failed to rotate edit key' }, 500);
    }
};

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}
