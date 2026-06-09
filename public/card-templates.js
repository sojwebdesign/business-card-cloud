/**
 * Card template registry — add new templates here.
 */
window.CardTemplates = {
    registry: {
        sojern: {
            id: 'sojern',
            name: 'Sojern Branded',
            className: 'card-template-sojern',
            thumbClass: 'template-thumb-sojern',
            /** Cover: 1200×600 (2:1) */
            headerImage: '/business-card/Assets/card-header.png',
            headerPlaceholder: '/business-card/Assets/card-header-placeholder.svg',
            headerFallback: 'linear-gradient(135deg, #3d1f6e 0%, #6b2d9e 50%, #8012ff 100%)'
        }
    },

    getTemplate(id) {
        return this.registry[id] || this.registry.sojern;
    },

    listTemplates() {
        return Object.values(this.registry);
    },

    renderThumb(container, templateId) {
        const template = this.getTemplate(templateId);
        container.className = 'template-thumb-card';
        container.innerHTML = `
            <div class="template-thumb-card__header"></div>
            <div class="template-thumb-card__content">
                <div class="template-thumb-card__avatar" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="8" r="4"/>
                        <path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>
                    </svg>
                </div>
                <div class="template-thumb-card__identity">
                    <span class="template-thumb-card__line template-thumb-card__line--lg"></span>
                    <span class="template-thumb-card__line template-thumb-card__line--md"></span>
                    <span class="template-thumb-card__line template-thumb-card__line--sm"></span>
                </div>
                <div class="template-thumb-card__contacts">
                    <div class="template-thumb-card__contact">
                        <span class="template-thumb-card__icon"></span>
                        <span class="template-thumb-card__line template-thumb-card__line--contact"></span>
                    </div>
                    <div class="template-thumb-card__contact">
                        <span class="template-thumb-card__icon"></span>
                        <span class="template-thumb-card__line template-thumb-card__line--contact"></span>
                    </div>
                </div>
            </div>`;

        const header = container.querySelector('.template-thumb-card__header');
        const tryHeader = (src, next) => {
            const probe = new Image();
            probe.onload = () => { header.style.backgroundImage = `url('${src}')`; };
            probe.onerror = () => {
                if (next) tryHeader(next, null);
                else {
                    header.style.backgroundImage = 'none';
                    header.style.background = template.headerFallback;
                }
            };
            probe.src = src;
        };
        tryHeader(template.headerImage, template.headerPlaceholder);
    },

    getRowHref(fieldId, def, data) {
        if (fieldId === 'address') return null;
        if (!data?.value) return null;

        const value = data.value.trim();
        if (!value) return null;

        if (def.type === 'contact' && fieldId === 'email') {
            return `mailto:${value}`;
        }
        if (def.type === 'contact' && fieldId === 'phone') {
            return `tel:${value.replace(/[^\d+]/g, '')}`;
        }
        if (def.type === 'link') {
            if (/^https?:\/\//i.test(value)) return value;
            if (/^mailto:/i.test(value)) return value;
            if (/^tel:/i.test(value)) return value;
            return `https://${value}`;
        }
        return null;
    },

    render(container, templateId, cardData) {
        const template = this.getTemplate(templateId);
        const fields = window.CardFields;

        container.className = `sojern-card ${template.className}`;
        container.innerHTML = '';

        const header = document.createElement('div');
        header.className = 'sojern-card__header';
        const tryHeader = (src, next) => {
            const probe = new Image();
            probe.onload = () => { header.style.backgroundImage = `url('${src}')`; };
            probe.onerror = () => {
                if (next) tryHeader(next, null);
                else {
                    header.style.backgroundImage = 'none';
                    header.style.background = template.headerFallback;
                }
            };
            probe.src = src;
        };
        tryHeader(template.headerImage, template.headerPlaceholder);

        const content = document.createElement('div');
        content.className = 'sojern-card__content';

        const profile = document.createElement('div');
        profile.className = 'sojern-card__profile';

        const photoWrap = document.createElement('div');
        photoWrap.className = 'sojern-card__photo-wrap';

        if (cardData.photoDataUrl) {
            const img = document.createElement('img');
            img.className = 'sojern-card__photo';
            img.src = cardData.photoDataUrl;
            img.alt = '';
            photoWrap.appendChild(img);
        } else {
            const placeholder = document.createElement('div');
            placeholder.className = 'sojern-card__photo sojern-card__photo--placeholder';
            placeholder.innerHTML = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>`;
            photoWrap.appendChild(placeholder);
        }

        const identity = document.createElement('div');
        identity.className = 'sojern-card__identity';

        const name = document.createElement('h2');
        name.className = 'sojern-card__name';
        name.textContent = cardData.fullName || 'Your Name';

        const title = document.createElement('p');
        title.className = 'sojern-card__title';
        title.textContent = cardData.jobTitle || '';

        const company = document.createElement('p');
        company.className = 'sojern-card__company';
        company.textContent = fields.COMPANY_NAME;

        identity.appendChild(name);
        identity.appendChild(title);
        identity.appendChild(company);

        if (cardData.enabled?.headline && cardData.headline) {
            const hl = document.createElement('p');
            hl.className = 'sojern-card__meta';
            hl.textContent = cardData.headline;
            identity.appendChild(hl);
        }

        profile.appendChild(photoWrap);
        profile.appendChild(identity);

        const contactList = document.createElement('ul');
        contactList.className = 'sojern-card__contacts';

        const rows = fields.getContactRows(cardData);
        for (const row of rows) {
            const li = document.createElement('li');
            li.className = 'sojern-card__contact';

            const iconWrap = document.createElement('span');
            iconWrap.className = 'sojern-card__icon';
            iconWrap.innerHTML = window.CardIcons[row.def.icon] || window.CardIcons.link;

            const textWrap = document.createElement('span');
            textWrap.className = 'sojern-card__contact-text';

            const displayText = row.def.type === 'link'
                ? fields.getLinkDisplayText(row.data, row.def)
                : row.data.value;

            const isAddress = row.fieldId === 'address';
            const href = this.getRowHref(row.fieldId, row.def, row.data);
            const primary = document.createElement(href ? 'a' : 'span');
            primary.className = 'sojern-card__contact-primary'
                + (href ? ' sojern-card__contact-link' : '')
                + (isAddress ? ' sojern-card__contact-primary--address' : '');

            if (href) {
                primary.href = href;
                if (row.def.type === 'link') {
                    primary.target = '_blank';
                    primary.rel = 'noopener noreferrer';
                }
            }
            primary.textContent = displayText;

            textWrap.appendChild(primary);

            if (row.def.type === 'contact' && row.data.label) {
                const secondary = document.createElement('span');
                secondary.className = 'sojern-card__contact-secondary';
                secondary.textContent = row.data.label;
                textWrap.appendChild(secondary);
            }

            li.appendChild(iconWrap);
            li.appendChild(textWrap);
            contactList.appendChild(li);
        }

        content.appendChild(profile);
        if (rows.length) content.appendChild(contactList);

        container.appendChild(header);
        container.appendChild(content);
    }
};
