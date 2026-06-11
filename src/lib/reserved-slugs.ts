const RESERVED = new Set([
    'how-it-works',
    'admin',
    'api',
    'edit',
    'share',
    'assets',
    'vendor',
    'c',
    's',
    'styles.css',
    'app.js',
    'manifest.webmanifest',
    'photo'
]);

export function isReservedSlug(slug: string): boolean {
    return RESERVED.has(slug.toLowerCase());
}
