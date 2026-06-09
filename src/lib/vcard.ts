import type { CardData } from './types';

const COMPANY_NAME = 'Sojern';
const NONE_LABEL = 'None';

function contactTypeParam(label: string | undefined): string {
    return label && label !== NONE_LABEL ? `;TYPE=${label}` : '';
}

export interface VCardOptions {
    slug?: string;
    origin?: string;
}

function escapeVCard(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function normalizeUrl(value: string): string {
    return value.startsWith('http') ? value : `https://${value}`;
}

function parseName(fullName: string): { family: string; given: string } {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return { family: '', given: '' };
    if (parts.length === 1) return { family: parts[0], given: '' };
    return {
        family: parts[parts.length - 1],
        given: parts.slice(0, -1).join(' ')
    };
}

function foldLine(line: string): string {
    const maxLen = 75;
    if (line.length <= maxLen) return line;

    const chunks: string[] = [line.slice(0, maxLen)];
    let pos = maxLen;
    while (pos < line.length) {
        chunks.push(` ${line.slice(pos, pos + maxLen - 1)}`);
        pos += maxLen - 1;
    }
    return chunks.join('\r\n');
}

function embeddedPhotoLine(photoDataUrl: string | null | undefined): string | null {
    if (!photoDataUrl) return null;

    const match = photoDataUrl.match(/^data:image\/([\w.+-]+);base64,(.+)$/s);
    if (!match) return null;

    let type = match[1].toUpperCase();
    if (type === 'JPG') type = 'JPEG';
    if (type === 'SVG+XML' || type === 'WEBP') return null;

    const base64 = match[2].replace(/\s/g, '');
    if (base64.length > 120000) return null;

    return foldLine(`PHOTO;ENCODING=b;TYPE=${type}:${base64}`);
}

export function buildVCard(cardData: CardData, options: VCardOptions = {}): string {
    const { family, given } = parseName(cardData.fullName);
    const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        foldLine(`N:${escapeVCard(family)};${escapeVCard(given)};;;`),
        `FN:${escapeVCard(cardData.fullName)}`,
        `TITLE:${escapeVCard(cardData.jobTitle)}`,
        `ORG:${COMPANY_NAME}`
    ];

    if (options.slug) {
        lines.push(`UID:sojern-card-${options.slug}@sojern.design`);
    }

    lines.push(`REV:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);

    if (options.slug && options.origin && cardData.photoDataUrl) {
        lines.push(`PHOTO;VALUE=uri:${options.origin}/business-card/${options.slug}/photo`);
    }

    const embedded = embeddedPhotoLine(cardData.photoDataUrl);
    if (embedded) lines.push(embedded);

    if (cardData.email?.value) {
        lines.push(`EMAIL${contactTypeParam(cardData.email.label)}:${escapeVCard(cardData.email.value)}`);
    }
    if (cardData.enabled?.phone && cardData.phone?.value) {
        lines.push(`TEL${contactTypeParam(cardData.phone.label)}:${escapeVCard(cardData.phone.value)}`);
    }
    if (cardData.enabled?.address && cardData.address?.value) {
        lines.push(`ADR${contactTypeParam(cardData.address.label)}:;;${escapeVCard(cardData.address.value)};;;;`);
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
