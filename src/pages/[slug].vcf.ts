import type { APIRoute } from 'astro';
import { getCardBySlug } from '../lib/cards-store';
import { buildVCard } from '../lib/vcard';
import { slugify } from '../lib/slug';
import { isReservedSlug } from '../lib/reserved-slugs';
import { getPublicOrigin } from '../lib/site-url';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals, url }) => {
    const slug = params.slug;
    if (!slug || isReservedSlug(slug)) {
        return new Response('Not found', { status: 404 });
    }

    const record = await getCardBySlug(locals, slug);
    if (!record) {
        return new Response('Not found', { status: 404 });
    }

    const origin = getPublicOrigin(url.origin, locals);
    const vcf = buildVCard(record.cardData, { slug, origin });
    const filename = `${slugify(record.cardData.fullName)}.vcf`;

    return new Response(vcf, {
        status: 200,
        headers: {
            'Content-Type': `text/vcard; charset=utf-8; name="${filename}"`,
            'Content-Disposition': `inline; filename="${filename}"`,
            'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
    });
};
