import { PublishError } from './cards-store';

function readAdminKey(request: Request, body?: { adminKey?: string }): string {
    const header = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '').trim();
    return header || body?.adminKey?.trim() || '';
}

function safeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    const encoder = new TextEncoder();
    const left = encoder.encode(a);
    const right = encoder.encode(b);
    return crypto.subtle.timingSafeEqual(left, right);
}

export function requireAdminKey(
    locals: App.Locals,
    request: Request,
    body?: { adminKey?: string }
): void {
    const env = locals.runtime?.env as { DIGICARD_ADMIN_KEY?: string } | undefined;
    const expected = env?.DIGICARD_ADMIN_KEY?.trim();
    if (!expected) {
        throw new PublishError('Admin access is not configured', 503);
    }

    const provided = readAdminKey(request, body);
    if (!provided || !safeEqual(provided, expected)) {
        throw new PublishError('Invalid admin credentials', 403);
    }
}
