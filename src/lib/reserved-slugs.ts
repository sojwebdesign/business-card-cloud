const RESERVED = new Set([
    'api',
    'edit',
    'share',
    'assets',
    'vendor',
    'c',
    's',
    'styles.css',
    'app.js',
    'manifest.webmanifest'
]);

export function isReservedSlug(slug: string): boolean {
    return RESERVED.has(slug.toLowerCase());
}
