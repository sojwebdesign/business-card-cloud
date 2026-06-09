import type { APIRoute } from 'astro';
import { getCardBySlug } from '../../lib/cards-store';
import { buildVCard } from '../../lib/vcard';
import { slugify } from '../../lib/slug';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
    const slug = params.slug;
    if (!slug) {
        return new Response('Not found', { status: 404 });
    }

    const record = await getCardBySlug(locals, slug);
    if (!record) {
        return new Response('Not found', { status: 404 });
    }

    const vcf = buildVCard(record.cardData);
    const filename = `${slugify(record.cardData.fullName)}.vcf`;

    return new Response(vcf, {
        status: 200,
        headers: {
            'Content-Type': 'text/vcard; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`
        }
    });
};
