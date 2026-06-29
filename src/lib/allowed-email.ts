export const ALLOWED_EMAIL_DOMAINS = ['sojern.com', 'rategain.com'] as const;

export function getEmailDomain(email: string): string | null {
    const at = email.lastIndexOf('@');
    if (at < 0) return null;
    return email.slice(at + 1).toLowerCase().trim() || null;
}

export function isAllowedWorkEmail(email: string): boolean {
    const domain = getEmailDomain(email);
    return domain !== null && (ALLOWED_EMAIL_DOMAINS as readonly string[]).includes(domain);
}

export function allowedEmailError(): string {
    return 'Use your @sojern.com or @rategain.com work email';
}
