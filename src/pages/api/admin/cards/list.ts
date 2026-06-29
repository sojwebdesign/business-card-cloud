import type { APIRoute } from 'astro';
import { listAllCards, PublishError } from '../../../../lib/cards-store';
import { requireAdminKey } from '../../../../lib/admin-auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
    try {
        const body = await request.json();
        requireAdminKey(locals, request, body);

        const cursor = typeof body?.cursor === 'string' ? body.cursor : undefined;
        const limit = typeof body?.limit === 'number' ? body.limit : undefined;
        const templateId = typeof body?.templateId === 'string' ? body.templateId.trim() : undefined;
        const search = typeof body?.search === 'string' ? body.search.trim() : undefined;
        const result = await listAllCards(locals, { cursor, limit, templateId, search });

        return json(result);
    } catch (error) {
        if (error instanceof PublishError) {
            return json({ error: error.message }, error.status);
        }
        console.error('Admin list cards failed', error);
        return json({ error: 'Could not list cards' }, 500);
    }
};

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}
