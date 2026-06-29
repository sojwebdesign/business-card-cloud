import { defineMiddleware } from 'astro:middleware';

const LONG_CACHE = 'public, max-age=86400, stale-while-revalidate=604800';

export const onRequest = defineMiddleware(async (context, next) => {
    const response = await next();
    const path = context.url.pathname;

    if (!path.startsWith('/business-card/')) {
        return response;
    }

    if (/\.(js|css|png|jpe?g|svg|webp|woff2?|ico|webmanifest)$/i.test(path)) {
        const headers = new Headers(response.headers);
        if (!headers.has('Cache-Control')) {
            headers.set('Cache-Control', LONG_CACHE);
        }
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers
        });
    }

    return response;
});
