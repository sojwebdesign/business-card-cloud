import type { CardData } from './types';

const COMPANY_NAME = 'Sojern';

function escapeVCard(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function normalizeUrl(value: string): string {
    return value.startsWith('http') ? value : `https://${value}`;
}

export function buildVCard(cardData: CardData): string {
    const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${escapeVCard(cardData.fullName)}`,
        `TITLE:${escapeVCard(cardData.jobTitle)}`,
        `ORG:${COMPANY_NAME}`
    ];

    if (cardData.email?.value) {
        lines.push(`EMAIL;TYPE=${cardData.email.label}:${escapeVCard(cardData.email.value)}`);
    }
    if (cardData.enabled?.phone && cardData.phone?.value) {
        lines.push(`TEL;TYPE=${cardData.phone.label}:${escapeVCard(cardData.phone.value)}`);
    }
    if (cardData.enabled?.companyUrl && cardData.companyUrl?.value) {
        lines.push(`URL:${normalizeUrl(cardData.companyUrl.value)}`);
    }
    if (cardData.enabled?.linkedin && cardData.linkedin?.value) {
        lines.push(`URL:${normalizeUrl(cardData.linkedin.value)}`);
    }
    if (cardData.enabled?.calendly && cardData.calendly?.value) {
        lines.push(`URL:${normalizeUrl(cardData.calendly.value)}`);
    }
    if (cardData.enabled?.link && cardData.link?.value) {
        lines.push(`URL:${normalizeUrl(cardData.link.value)}`);
    }

    lines.push('END:VCARD');
    return lines.join('\r\n');
}
