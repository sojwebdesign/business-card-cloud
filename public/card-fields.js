/**
 * Field registry — add new fields here to extend the card builder.
 * Each field drives form UI, validation, and vCard export.
 */
window.CardFields = {
    ALLOWED_EMAIL_DOMAINS: ['sojern.com', 'rategain.com'],
    NONE_LABEL: 'None',

    getTemplateBrand(templateId) {
        const template = window.CardTemplates?.getTemplate(templateId);
        return {
            companyName: template?.companyName || 'Sojern',
            companyUrlDefault: template?.companyUrlDefault || 'www.sojern.com'
        };
    },

    isAllowedWorkEmail(email) {
        const domain = String(email || '').split('@')[1]?.toLowerCase().trim();
        return Boolean(domain && this.ALLOWED_EMAIL_DOMAINS.includes(domain));
    },

    showContactLabel(label) {
        return Boolean(label && label !== this.NONE_LABEL);
    },

    /** @type {Record<string, import('./types').FieldDefinition>} */
    definitions: {
        fullName: {
            id: 'fullName',
            label: 'Full name',
            type: 'text',
            required: true,
            alwaysOn: true,
            section: 'required',
            placeholder: 'Your full name',
            vcard: 'FN'
        },
        jobTitle: {
            id: 'jobTitle',
            label: 'Job title',
            type: 'text',
            required: true,
            alwaysOn: true,
            section: 'required',
            placeholder: 'Senior Account Executive',
            vcard: 'TITLE'
        },
        email: {
            id: 'email',
            label: 'Email',
            type: 'contact',
            required: true,
            alwaysOn: true,
            section: 'required',
            placeholder: 'name@sojern.com or name@rategain.com',
            inputType: 'email',
            labelOptions: ['Work', 'Personal', 'None'],
            defaultLabel: 'Work',
            icon: 'email',
            vcard: 'EMAIL'
        },
        photo: {
            id: 'photo',
            label: 'Headshot',
            type: 'photo',
            alwaysOn: true,
            section: 'required'
        },
        company: {
            id: 'company',
            label: 'Company',
            type: 'fixed',
            alwaysOn: true,
            fixedValue: null,
            showOnCard: true,
            vcard: 'ORG'
        },
        headline: {
            id: 'headline',
            label: 'Headline',
            type: 'text',
            optional: true,
            defaultEnabled: false,
            section: 'optional',
            placeholder: 'Short tagline or bio line',
            showOnCard: true
        },
        companyUrl: {
            id: 'companyUrl',
            label: 'Company URL',
            type: 'link',
            optional: true,
            defaultEnabled: true,
            section: 'optional',
            placeholder: 'www.example.com',
            defaultValue: '',
            defaultDisplay: 'Visit our website',
            icon: 'website',
            vcard: 'URL'
        },
        phone: {
            id: 'phone',
            label: 'Phone',
            type: 'contact',
            optional: true,
            defaultEnabled: false,
            section: 'optional',
            placeholder: '+1 (555) 123-4567',
            inputType: 'tel',
            labelOptions: ['Mobile', 'Work', 'Home', 'Main', 'Personal', 'None'],
            defaultLabel: 'Mobile',
            icon: 'phone',
            vcard: 'TEL'
        },
        link: {
            id: 'link',
            label: 'Link',
            type: 'link',
            optional: true,
            defaultEnabled: false,
            section: 'optional',
            placeholder: 'https://example.com',
            defaultDisplay: 'View link',
            icon: 'link',
            vcard: 'URL'
        },
        address: {
            id: 'address',
            label: 'Address',
            type: 'contact',
            optional: true,
            defaultEnabled: false,
            section: 'optional',
            placeholder: '123 Main St\nCity, ST 12345',
            inputType: 'textarea',
            labelOptions: ['Work', 'Home', 'None'],
            defaultLabel: 'Work',
            icon: 'address',
            vcard: 'ADR'
        },
        linkedin: {
            id: 'linkedin',
            label: 'LinkedIn',
            type: 'link',
            optional: true,
            defaultEnabled: false,
            section: 'optional',
            placeholder: 'https://linkedin.com/in/username',
            defaultDisplay: 'Connect with me on LinkedIn',
            icon: 'linkedin',
            vcard: 'URL'
        },
        calendly: {
            id: 'calendly',
            label: 'Calendly',
            type: 'link',
            optional: true,
            defaultEnabled: false,
            section: 'optional',
            placeholder: 'https://calendly.com/username',
            defaultDisplay: 'Schedule a meeting',
            icon: 'calendly',
            vcard: 'URL'
        }
    },

    getDefinition(id) {
        return this.definitions[id];
    },

    getRequiredFields() {
        return Object.values(this.definitions).filter((f) => f.required);
    },

    getOptionalFields() {
        return Object.values(this.definitions).filter((f) => f.optional);
    },

    shouldDisplayHeadshot(cardData) {
        return !cardData?.hideHeadshot;
    },

    createDefaultCardData(templateId = 'sojern') {
        const brand = this.getTemplateBrand(templateId);
        const data = {
            templateId,
            fullName: '',
            jobTitle: '',
            photoDataUrl: null,
            photoSourceUrl: null,
            photoCrop: null,
            hideHeadshot: false,
            company: brand.companyName,
            enabled: {}
        };

        for (const field of Object.values(this.definitions)) {
            if (field.type === 'fixed') continue;
            if (field.type === 'photo') continue;
            if (field.type === 'text' && field.alwaysOn) {
                data[field.id] = '';
                continue;
            }
            if (field.type === 'contact' && field.alwaysOn) {
                data[field.id] = { value: '', label: field.defaultLabel };
                continue;
            }
            if (field.optional) {
                data.enabled[field.id] = field.defaultEnabled ?? false;
                if (field.type === 'text') {
                    data[field.id] = '';
                } else if (field.type === 'contact') {
                    data[field.id] = { value: '', label: field.defaultLabel };
                } else if (field.type === 'link') {
                    const defaultUrl = field.id === 'companyUrl' ? brand.companyUrlDefault : (field.defaultValue || '');
                    data[field.id] = {
                        value: defaultUrl,
                        displayMode: 'custom',
                        customLabel: field.defaultDisplay || ''
                    };
                }
            }
        }

        return data;
    },

    getLinkDisplayText(fieldData, fieldDef) {
        if (!fieldData) return '';
        if (fieldData.displayMode === 'url') {
            return fieldData.value || '';
        }
        return fieldData.customLabel || fieldData.value || fieldDef.defaultDisplay || '';
    },

    getContactRows(cardData) {
        const rows = [];
        const addRow = (fieldId) => {
            const def = this.definitions[fieldId];
            if (!def || !def.icon) return;

            if (def.alwaysOn && def.type === 'contact') {
                const f = cardData[fieldId];
                if (f?.value) rows.push({ fieldId, def, data: f });
                return;
            }

            if (!def.optional || !cardData.enabled[fieldId]) return;

            if (def.type === 'contact') {
                const f = cardData[fieldId];
                if (f?.value) rows.push({ fieldId, def, data: f });
            } else if (def.type === 'link') {
                const f = cardData[fieldId];
                if (f?.value) rows.push({ fieldId, def, data: f });
            }
        };

        addRow('email');
        addRow('phone');
        addRow('companyUrl');
        addRow('link');
        addRow('address');
        addRow('linkedin');
        addRow('calendly');

        return rows;
    }
};
