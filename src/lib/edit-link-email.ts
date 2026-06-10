import type { EmailEnv } from './email-env';
import { sendEmail } from './email';

interface EditLinkEmailCard {
    fullName: string;
    token: string;
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function buildEmailHtml(origin: string, cards: EditLinkEmailCard[]): string {
    const links = cards.map((card) => {
        const url = `${origin}/business-card/?token=${encodeURIComponent(card.token)}`;
        return `<li style="margin-bottom:12px;"><strong>${escapeHtml(card.fullName)}</strong><br><a href="${url}">Open editor</a><br><span style="color:#666;font-size:12px;">Expires in 1 hour · single use</span></li>`;
    }).join('');

    return `
        <div style="font-family:Inter,Arial,sans-serif;color:#242452;line-height:1.5;max-width:560px;">
            <p>Here ${cards.length === 1 ? 'is your Sojern DigiCard edit link' : 'are your Sojern DigiCard edit links'}:</p>
            <ul style="padding-left:20px;">${links}</ul>
            <p style="color:#666;font-size:14px;">This link expires in 1 hour and can only be used once. If you need another link, use <strong>Find my card</strong> on the DigiCard builder.</p>
        </div>
    `.trim();
}

export async function sendEditLinkEmail(
    env: EmailEnv,
    origin: string,
    toEmail: string,
    cards: EditLinkEmailCard[]
): Promise<void> {
    await sendEmail(env, {
        to: toEmail,
        subject: cards.length === 1
            ? 'Your Sojern DigiCard edit link'
            : 'Your Sojern DigiCard edit links',
        html: buildEmailHtml(origin, cards)
    });
}
