import type { APIRoute } from 'astro';
import { deleteCardAdmin, PublishError } from '../../../../lib/cards-store';
import { requireAdminKey } from '../../../../lib/admin-auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
    try {
        const body = await request.json();
        requireAdminKey(locals, request, body);

        const slug = typeof body?.slug === 'string' ? body.slug.trim() : '';
        if (!slug) {
            return json({ error: 'Slug is required' }, 400);
        }

        await deleteCardAdmin(locals, slug);
        return json({ ok: true, slug });
    } catch (error) {
        if (error instanceof PublishError) {
            return json({ error: error.message }, error.status);
        }
        console.error('Admin delete card failed', error);
        return json({ error: 'Could not delete card' }, 500);
    }
};

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}
