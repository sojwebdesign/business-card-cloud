/** Production Design Hub origin — used for card links shown to users. */
export const DEFAULT_PUBLIC_ORIGIN = 'https://sojern.design';

/** Strip trailing slash from an origin or URL base. */
function stripTrailingSlash(value: string): string {
    return value.replace(/\/$/, '');
}

function isStagingOrigin(origin: string): boolean {
    try {
        const host = new URL(origin).hostname;
        return (
            host.includes('cosmic.webflow.services')
            || host.includes('.webflow.io')
            || host.endsWith('.workers.dev')
        );
    } catch {
        return false;
    }
}

/**
 * Public origin for card links shown to users and encoded in QR codes.
 * Prefers PUBLIC_SITE_ORIGIN from env; falls back to sojern.design when
 * the request comes from a Webflow Cloud staging/preview URL.
 */
export function getPublicOrigin(fallback: string, locals?: App.Locals): string {
    const runtimeEnv = locals?.runtime?.env as { PUBLIC_SITE_ORIGIN?: string } | undefined;
    const configured = runtimeEnv?.PUBLIC_SITE_ORIGIN || import.meta.env.PUBLIC_SITE_ORIGIN;

    if (configured && typeof configured === 'string' && configured.startsWith('http')) {
        return stripTrailingSlash(configured);
    }

    if (isStagingOrigin(fallback)) {
        return DEFAULT_PUBLIC_ORIGIN;
    }

    return stripTrailingSlash(fallback);
}
