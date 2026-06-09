import type { APIRoute } from 'astro';
import { getCardBySlug, buildCardUrls } from '../../lib/cards-store';
import { APP_NAME, APPLE_TOUCH_ICON } from '../../lib/brand-assets';
import { getPublicOrigin } from '../../lib/site-url';
import { isReservedSlug } from '../../lib/reserved-slugs';

export const prerender = false;

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

    const manifest = {
        name: APP_NAME,
        short_name: APP_NAME,
        description: 'Sojern digital business card',
        start_url: urls.shareUrl,
        scope: `${origin}/business-card/`,
        display: 'standalone',
        background_color: '#242452',
        theme_color: '#242452',
        orientation: 'portrait',
        icons: [
            {
                src: `${origin}${APPLE_TOUCH_ICON}`,
                sizes: '180x180',
                type: 'image/png',
                purpose: 'any'
            },
            {
                src: `${origin}${APPLE_TOUCH_ICON}`,
                sizes: '180x180',
                type: 'image/png',
                purpose: 'maskable'
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
