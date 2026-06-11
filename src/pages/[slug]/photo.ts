import type { APIRoute } from 'astro';
import { getCardBySlug } from '../../lib/cards-store';
import { isReservedSlug } from '../../lib/reserved-slugs';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
    const slug = params.slug;
    if (!slug || isReservedSlug(slug)) {
        return new Response('Not found', { status: 404 });
    }

    const record = await getCardBySlug(locals, slug);
    const photoDataUrl = record?.cardData?.hideHeadshot ? null : record?.cardData?.photoDataUrl;
    if (!photoDataUrl) {
        return new Response('Not found', { status: 404 });
    }

    const match = photoDataUrl.match(/^data:image\/([\w.+-]+);base64,(.+)$/s);
    if (!match) {
        return new Response('Not found', { status: 404 });
    }

    const type = match[1].toLowerCase();
    const bytes = Uint8Array.from(atob(match[2].replace(/\s/g, '')), (c) => c.charCodeAt(0));

    return new Response(bytes, {
        status: 200,
        headers: {
            'Content-Type': `image/${type === 'jpg' ? 'jpeg' : type}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
    });
};
