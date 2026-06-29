export interface ContactField {
    value: string;
    label: string;
}

export interface LinkField {
    value: string;
    displayMode: 'url' | 'custom';
    customLabel: string;
}

export interface CardData {
    templateId: string;
    fullName: string;
    jobTitle: string;
    photoDataUrl: string | null;
    photoUrl?: string | null;
    photoSourceUrl?: string | null;
    photoCrop?: unknown;
    hideHeadshot?: boolean;
    company: string;
    enabled: Record<string, boolean>;
    headline?: string;
    companyUrl?: LinkField;
    phone?: ContactField;
    link?: LinkField;
    address?: ContactField;
    linkedin?: LinkField;
    calendly?: LinkField;
    email: ContactField;
}

export interface PublishedCard {
    slug: string;
    editKey: string;
    templateId: string;
    cardData: CardData;
    publishedAt: string;
    updatedAt: string;
}

export interface PublishResponse {
    slug: string;
    editKey: string;
    shareUrl: string;
    contactUrl: string;
    editUrl: string;
    vcfUrl: string;
    updated: boolean;
}
