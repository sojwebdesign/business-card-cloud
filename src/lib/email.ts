import type { EmailEnv } from './email-env';
import { isGmailConfigured, resolveFromAddress } from './email-env';

interface SendEmailInput {
    to: string;
    subject: string;
    html: string;
}

async function getGmailAccessToken(env: EmailEnv): Promise<string> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: env.GMAIL_CLIENT_ID!.trim(),
            client_secret: env.GMAIL_CLIENT_SECRET!.trim(),
            refresh_token: env.GMAIL_REFRESH_TOKEN!.trim(),
            grant_type: 'refresh_token'
        })
    });

    const data = await response.json() as { access_token?: string; error?: string; error_description?: string };
    if (!response.ok || !data.access_token) {
        console.error('Gmail token refresh failed', data.error, data.error_description);
        throw new Error('Could not authenticate with Gmail');
    }

    return data.access_token;
}

function encodeMimeForGmail(raw: string): string {
    const bytes = new TextEncoder().encode(raw);
    let binary = '';
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }

    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
}

function buildMimeMessage(from: string, to: string, subject: string, html: string): string {
    const normalizedSubject = subject.replace(/\r?\n/g, ' ');
    return [
        `From: ${from}`,
        `To: ${to}`,
        `Subject: ${normalizedSubject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: 7bit',
        '',
        html
    ].join('\r\n');
}

async function sendViaGmail(env: EmailEnv, input: SendEmailInput): Promise<void> {
    const accessToken = await getGmailAccessToken(env);
    const from = resolveFromAddress(env);
    const raw = buildMimeMessage(from, input.to, input.subject, input.html);

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: encodeMimeForGmail(raw) })
    });

    if (!response.ok) {
        const detail = await response.text();
        console.error('Gmail send failed', response.status, detail);
        throw new Error('Could not send email via Gmail');
    }
}

async function sendViaResend(env: EmailEnv, input: SendEmailInput): Promise<void> {
    const apiKey = env.RESEND_API_KEY?.trim();
    if (!apiKey) {
        console.error('No email provider configured (Gmail or Resend)');
        throw new Error('Email service is not configured');
    }

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: resolveFromAddress(env),
            to: [input.to],
            subject: input.subject,
            html: input.html
        })
    });

    if (!response.ok) {
        const detail = await response.text();
        console.error('Resend email failed', response.status, detail);
        throw new Error('Could not send email via Resend');
    }
}

export async function sendEmail(env: EmailEnv, input: SendEmailInput): Promise<void> {
    if (isGmailConfigured(env)) {
        await sendViaGmail(env, input);
        return;
    }

    await sendViaResend(env, input);
}
