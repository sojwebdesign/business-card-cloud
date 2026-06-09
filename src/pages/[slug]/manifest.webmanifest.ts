import type { APIRoute } from 'astro';
import { getCardBySlug, buildCardUrls } from '../../lib/cards-store';
import { getPublicOrigin } from '../../lib/site-url';
import { isReservedSlug } from '../../lib/reserved-slugs';

export const prerender = false;

const FAVICON_LIGHT = '/business-card/Assets/DigiCard_Favicon_Light.png';
const FAVICON_DARK = '/business-card/Assets/DigiCard_Favicon_Dark.png';

export const GET: APIRoute = async ({ params, locals, url }) => {
    const slug = params.slug;
    if (!slug || isReservedSlug(slug)) {
        return new Response('Not found', { status: 404 });
    }

    const card = await getCardBySlug(locals, slug);
    if (!card) {
        return new Response('Not found', { status: 404 });
    }

    const origin = getPublicOrigin(url.origin, locals);
    const urls = buildCardUrls(origin, slug, card.editKey);
    const firstName = card.cardData.fullName.trim().split(/\s+/)[0] || 'DigiCard';

    const manifest = {
        name: `${card.cardData.fullName} — DigiCard`,
        short_name: firstName,
        description: 'Sojern digital business card',
        start_url: urls.shareUrl,
        scope: `${origin}/business-card/`,
        display: 'standalone',
        background_color: '#f8f9fa',
        theme_color: '#242452',
        orientation: 'portrait',
        icons: [
            {
                src: `${origin}${FAVICON_LIGHT}`,
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
            },
            {
                src: `${origin}${FAVICON_DARK}`,
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
            }
        ]
    };

    return new Response(JSON.stringify(manifest), {
        status: 200,
        headers: {
            'Content-Type': 'application/manifest+json',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
    });
};
