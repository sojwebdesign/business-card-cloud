export interface EmailEnv {
    GMAIL_CLIENT_ID?: string;
    GMAIL_CLIENT_SECRET?: string;
    GMAIL_REFRESH_TOKEN?: string;
    GMAIL_FROM_EMAIL?: string;
    GMAIL_FROM_NAME?: string;
    RESEND_API_KEY?: string;
    EDIT_LINK_EMAIL_FROM?: string;
}

export function isGmailConfigured(env: EmailEnv): boolean {
    return Boolean(
        env.GMAIL_CLIENT_ID?.trim()
        && env.GMAIL_CLIENT_SECRET?.trim()
        && env.GMAIL_REFRESH_TOKEN?.trim()
        && env.GMAIL_FROM_EMAIL?.trim()
    );
}

export function resolveFromAddress(env: EmailEnv): string {
    if (isGmailConfigured(env)) {
        const name = env.GMAIL_FROM_NAME?.trim() || 'Sojern DigiCard';
        const email = env.GMAIL_FROM_EMAIL!.trim();
        return `${name} <${email}>`;
    }

    return env.EDIT_LINK_EMAIL_FROM?.trim() || 'Sojern DigiCard <digicard@sojern.design>';
}
