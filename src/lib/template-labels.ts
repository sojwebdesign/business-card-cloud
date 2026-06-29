const TEMPLATE_LABELS: Record<string, string> = {
    sojern: 'Sojern Branded',
    rategain: 'RateGain Branded'
};

export function getTemplateLabel(templateId: string): string {
    return TEMPLATE_LABELS[templateId] || TEMPLATE_LABELS.sojern;
}
