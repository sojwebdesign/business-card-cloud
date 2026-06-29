import type { CardData } from './types';

export function getTemplateHeaderImage(templateId: string): string {
    return templateId === 'rategain'
        ? '/business-card/Assets/card-header-rategain.png'
        : '/business-card/Assets/card-header.png';
}

/** Strip embedded headshot data from HTML payloads; use the photo endpoint instead. */
export function toPublicCardView(cardData: CardData, slug: string, updatedAt: string): CardData {
    const view = structuredClone(cardData) as CardData & { photoUrl?: string | null };
    if (!view.hideHeadshot && view.photoDataUrl) {
        view.photoUrl = `/business-card/${slug}/photo?v=${encodeURIComponent(updatedAt)}`;
        view.photoDataUrl = null;
    }
    return view;
}
