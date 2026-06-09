import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
    const slug = params.slug;
    if (!slug) {
        return new Response('Not found', { status: 404 });
    }

    return new Response(null, {
        status: 301,
        headers: { Location: `/business-card/${slug}.vcf` }
    });
};
