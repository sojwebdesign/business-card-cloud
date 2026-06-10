import type { EmailEnv } from './email-env';
import { sendEmail } from './email';

interface DeleteLinkEmailCard {
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

function buildEmailHtml(origin: string, cards: DeleteLinkEmailCard[]): string {
    const links = cards.map((card) => {
        const url = `${origin}/business-card/?delete=${encodeURIComponent(card.token)}`;
        return `<li style="margin-bottom:12px;"><strong>${escapeHtml(card.fullName)}</strong><br><a href="${url}">Confirm card deletion</a><br><span style="color:#666;font-size:12px;">Expires in 1 hour · single use</span></li>`;
    }).join('');

    return `
        <div style="font-family:Inter,Arial,sans-serif;color:#242452;line-height:1.5;max-width:560px;">
            <p>You requested to delete ${cards.length === 1 ? 'this Sojern DigiCard' : 'these Sojern DigiCards'}. Click below to confirm — this cannot be undone:</p>
            <ul style="padding-left:20px;">${links}</ul>
            <p style="color:#666;font-size:14px;">If you did not request this, ignore this email. The link expires in 1 hour and works only once.</p>
        </div>
    `.trim();
}

export async function sendDeleteLinkEmail(
    env: EmailEnv,
    origin: string,
    toEmail: string,
    cards: DeleteLinkEmailCard[]
): Promise<void> {
    await sendEmail(env, {
        to: toEmail,
        subject: cards.length === 1
            ? 'Confirm Sojern DigiCard deletion'
            : 'Confirm Sojern DigiCard deletions',
        html: buildEmailHtml(origin, cards)
    });
}
