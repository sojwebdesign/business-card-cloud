/** Strip trailing slash from an origin or URL base. */
function stripTrailingSlash(value: string): string {
    return value.replace(/\/$/, '');
}

/**
 * Public origin for card links shown to users and encoded in QR codes.
 * Set PUBLIC_SITE_ORIGIN in Webflow Cloud (e.g. https://sojern.design)
 * so links use your production domain instead of the cosmic staging URL.
 */
export function getPublicOrigin(fallback: string, locals?: App.Locals): string {
    const runtimeEnv = locals?.runtime?.env as { PUBLIC_SITE_ORIGIN?: string } | undefined;
    const configured = runtimeEnv?.PUBLIC_SITE_ORIGIN || import.meta.env.PUBLIC_SITE_ORIGIN;
    if (configured && typeof configured === 'string' && configured.startsWith('http')) {
        return stripTrailingSlash(configured);
    }
    return stripTrailingSlash(fallback);
}
