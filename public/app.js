/**
 * Contact Card Builder
 * Flow: basics → template → editor (field customization + preview)
 */

let cardData = CardFields.createDefaultCardData();
let currentTemplate = 'sojern';
let publishState = {
    slug: null,
    editKey: null,
    shareUrl: null,
    contactUrl: null,
    editUrl: null,
    published: false
};
let duplicateCreateConfirmed = false;
let duplicateConfirmedForEmail = null;
let pendingBasicsAfterDuplicate = null;

const homeSection = document.getElementById('homeSection');
const templateSelectionSection = document.getElementById('templateSelectionSection');
const editorSection = document.getElementById('editorSection');
const basicsForm = document.getElementById('basicsForm');
const templateGrid = document.getElementById('templateGrid');
const templateUserName = document.getElementById('templateUserName');
const fieldEditor = document.getElementById('fieldEditor');
const cardPreviewMount = document.getElementById('cardPreviewMount');
const startOverBtn = document.getElementById('startOverBtn');
const downloadDropdown = document.getElementById('downloadDropdown');
const downloadBtn = document.getElementById('downloadBtn');
const downloadMenu = document.getElementById('downloadMenu');
const themeToggle = document.getElementById('themeToggle');
const qrCanvas = document.getElementById('qrCanvas');
const addToHomeModal = document.getElementById('addToHomeModal');
const closeHomeModal = document.getElementById('closeHomeModal');
const publishModal = document.getElementById('publishModal');
const publishBtn = document.getElementById('publishBtn');
const publishHint = document.getElementById('publishHint');
const qrHint = document.getElementById('qrHint');
const copyPublicLinkBtn = document.getElementById('copyPublicLinkBtn');
const saveQrBtn = document.getElementById('saveQrBtn');
const addToHomeBtn = document.getElementById('addToHomeBtn');

const CARD_PUBLIC_ORIGIN = (
    document.querySelector('meta[name="card-public-origin"]')?.content
    || 'https://sojern.design'
).replace(/\/$/, '');

init();

function init() {
    renderTemplateGrid();
    bindTheme();
    bindDownloadMenu();
    bindBasicsForm();
    bindNavigation();
    bindShareActions();
    bindModal();
    bindPublishModal();
    bindRecoverModal();
    bindDeleteConfirmModal();
    bindDuplicateEmailModal();
    loadEditFromUrl();
    loadDeleteFromUrl();
}

function bindTheme() {
    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        themeToggle.querySelectorAll('.theme-toggle-option').forEach((opt) => {
            opt.classList.toggle('active', opt.dataset.theme === theme);
        });
        window.DigiCardBrand?.applyFavicon(theme);
    };

    const saved = localStorage.getItem('digicard-theme');
    if (saved === 'dark' || saved === 'light') {
        applyTheme(saved);
    } else {
        applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }

    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        localStorage.setItem('digicard-theme', next);
        applyTheme(next);
    });
}

function bindDownloadMenu() {
    downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        downloadDropdown.classList.toggle('open');
    });
    document.addEventListener('click', () => downloadDropdown.classList.remove('open'));
    downloadMenu.addEventListener('click', (e) => e.stopPropagation());
}

function bindModal() {
    closeHomeModal?.addEventListener('click', closeHomeScreenGuideModal);
    addToHomeModal?.addEventListener('click', (e) => {
        if (e.target === addToHomeModal) closeHomeScreenGuideModal();
    });
    document.getElementById('homeScreenGuideLink')?.addEventListener('click', () => {
        openHomeScreenGuideModal(publishState.shareUrl || '');
    });
}

function closeHomeScreenGuideModal() {
    addToHomeModal?.classList.add('hidden');
    addToHomeModal?.classList.remove('modal-overlay--stacked');
}

function bindPublishModal() {
    document.getElementById('closePublishModal')?.addEventListener('click', () => publishModal.classList.add('hidden'));
    publishModal?.addEventListener('click', (e) => {
        if (e.target === publishModal) publishModal.classList.add('hidden');
    });
    document.getElementById('publishDoneBtn')?.addEventListener('click', () => publishModal.classList.add('hidden'));
    document.getElementById('copyShareUrlBtn')?.addEventListener('click', () => copyText('shareUrlInput', 'My card link copied'));
    document.getElementById('copyContactUrlBtn')?.addEventListener('click', () => copyText('contactUrlInput', 'Contact link copied'));
    document.getElementById('publishSaveQrBtn')?.addEventListener('click', saveQrToPhotos);
}

function bindBasicsForm() {
    basicsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('fullName').value.trim();
        const jobTitle = document.getElementById('jobTitle').value.trim();
        const email = document.getElementById('email').value.trim();

        if (!fullName) return showToast('Please enter your full name', 'error');
        if (!jobTitle) return showToast('Please enter your job title', 'error');
        if (!email) return showToast('Please enter your email', 'error');

        cardData.fullName = fullName;
        cardData.jobTitle = jobTitle;
        cardData.email.value = email;
        templateUserName.textContent = fullName;

        const submitBtn = basicsForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
        }

        if (duplicateConfirmedForEmail !== email) {
            duplicateCreateConfirmed = false;
            duplicateConfirmedForEmail = null;
        }

        try {
            const duplicateCheck = await checkEmailForDuplicates(email, fullName);
            if (duplicateCheck?.hasExisting && !duplicateCreateConfirmed) {
                showDuplicateEmailModal(duplicateCheck, email);
                return;
            }
            showTemplateSelection();
        } catch (error) {
            showToast(error.message || 'Could not verify email', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
            }
        }
    });
}

function bindNavigation() {
    document.getElementById('templateBackBtn').addEventListener('click', showHome);
    document.getElementById('templateContinueBtn').addEventListener('click', proceedToEditor);
    startOverBtn.addEventListener('click', resetApp);
}

function readPhotoFile(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
        openPhotoCrop(e.target.result, callback);
    };
    reader.readAsDataURL(file);
}

function openPhotoCrop(sourceUrl, callback) {
    cardData.photoSourceUrl = sourceUrl;
    PhotoCrop.open(sourceUrl, (result) => {
        cardData.photoDataUrl = result.dataUrl;
        cardData.photoCrop = result.crop;
        callback();
    }, cardData.photoCrop);
}

function bindEditorPhotoEvents(section) {
    section.querySelector('#editorPhotoUpload')?.addEventListener('click', () => {
        section.querySelector('#editorPhotoInput').click();
    });
    section.querySelector('#editorPhotoInput')?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        readPhotoFile(file, () => {
            renderCardPreview();
            buildFieldEditor();
        });
    });
    section.querySelector('#editorAdjustCrop')?.addEventListener('click', () => {
        if (!cardData.photoSourceUrl) return;
        PhotoCrop.open(cardData.photoSourceUrl, (result) => {
            cardData.photoDataUrl = result.dataUrl;
            cardData.photoCrop = result.crop;
            renderCardPreview();
            buildFieldEditor();
        }, cardData.photoCrop);
    });
}

function renderTemplateGrid() {
    templateGrid.innerHTML = '';
    CardTemplates.listTemplates().forEach((tpl) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `effect-option effect-option-compact template-option${tpl.id === currentTemplate ? ' selected' : ''}`;
        btn.dataset.template = tpl.id;
        btn.innerHTML = `
            <div class="effect-option-preview">
                <div class="template-thumb"></div>
            </div>
            <span class="effect-option-label">${tpl.name}</span>`;
        CardTemplates.renderThumb(btn.querySelector('.template-thumb'), tpl.id);
        btn.addEventListener('click', () => {
            templateGrid.querySelectorAll('.template-option').forEach((el) => el.classList.remove('selected'));
            btn.classList.add('selected');
            currentTemplate = tpl.id;
            cardData.templateId = tpl.id;
        });
        templateGrid.appendChild(btn);
    });
}

function buildFieldEditor() {
    fieldEditor.innerHTML = '';

    const headerSection = document.createElement('div');
    headerSection.className = 'sidebar-section effect-header-section';
    headerSection.innerHTML = `
        <h2 class="sidebar-title-large">Customize Card</h2>
        <p class="sidebar-description">Toggle optional fields and edit labels. Company is always Sojern.</p>
        <button type="button" class="btn btn-secondary change-effect-btn" id="changeTemplateBtn">
            Change Template
        </button>`;
    headerSection.querySelector('#changeTemplateBtn').addEventListener('click', showTemplateSelection);

    const requiredSection = document.createElement('div');
    requiredSection.className = 'sidebar-section';
    requiredSection.innerHTML = '<h3 class="sidebar-title">Required fields</h3>';
    const requiredWrap = document.createElement('div');
    requiredWrap.className = 'field-editor-group';

    ['fullName', 'jobTitle', 'email'].forEach((id) => {
        requiredWrap.appendChild(createFieldControl(id));
    });
    requiredSection.appendChild(requiredWrap);

    const photoSection = document.createElement('div');
    photoSection.className = 'sidebar-section';
    const hideHeadshot = Boolean(cardData.hideHeadshot);
    photoSection.innerHTML = `
        <h3 class="sidebar-title">Headshot</h3>
        <p class="helper-text">Optional. Upload in the editor, then drag and zoom to set the focal point.</p>
        <label class="checkbox-label editor-headshot-toggle">
            <input type="checkbox" id="editorHideHeadshot"${hideHeadshot ? ' checked' : ''}>
            <span class="checkmark"></span>
            Do not display headshot
        </label>
        <div class="editor-photo-panel${hideHeadshot ? ' editor-photo-panel--hidden' : ''}" id="editorPhotoPanel">
            <div class="photo-upload photo-upload--compact" id="editorPhotoUpload">
                <input type="file" id="editorPhotoInput" accept="image/jpeg,image/jpg,image/png,image/webp" hidden>
                <div class="photo-upload-content${cardData.photoDataUrl ? ' hidden' : ''}" id="editorPhotoPlaceholder">
                    <span>Upload headshot</span>
                </div>
                <img class="photo-preview editor-photo-preview${cardData.photoDataUrl ? '' : ' hidden'}" id="editorPhotoPreview" src="${cardData.photoDataUrl || ''}" alt="">
            </div>
            <div class="photo-actions">
                <button type="button" class="btn btn-secondary" id="editorChangePhoto">Change photo</button>
                <button type="button" class="btn btn-secondary${cardData.photoSourceUrl ? '' : ' hidden'}" id="editorAdjustCrop">Adjust crop</button>
            </div>
        </div>`;

    const optionalSection = document.createElement('div');
    optionalSection.className = 'sidebar-section';
    optionalSection.innerHTML = '<h3 class="sidebar-title">Optional fields</h3><p class="helper-text">Toggle fields to include on your card.</p>';
    const optionalWrap = document.createElement('div');
    optionalWrap.className = 'field-editor-group';

    CardFields.getOptionalFields().forEach((def) => {
        optionalWrap.appendChild(createOptionalFieldBlock(def));
    });

    optionalSection.appendChild(optionalWrap);

    fieldEditor.appendChild(headerSection);
    fieldEditor.appendChild(requiredSection);
    fieldEditor.appendChild(photoSection);
    fieldEditor.appendChild(optionalSection);

    if (publishState.published && publishState.slug && publishState.editKey) {
        const securitySection = document.createElement('div');
        securitySection.className = 'sidebar-section';
        securitySection.innerHTML = `
            <h3 class="sidebar-title">Edit link security</h3>
            <p class="helper-text">Invalidate any old edit links you may have saved or shared. Request a fresh link anytime via <strong>Find my card</strong>.</p>
            <button type="button" class="btn btn-secondary" id="rotateEditKeyBtn">Invalidate old edit links</button>`;
        securitySection.querySelector('#rotateEditKeyBtn').addEventListener('click', rotateEditKey);
        fieldEditor.appendChild(securitySection);

        const dangerSection = document.createElement('div');
        dangerSection.className = 'sidebar-section sidebar-danger-zone';
        dangerSection.innerHTML = `
            <h3 class="sidebar-title">Delete card</h3>
            <p class="helper-text">Permanently remove this card and all its links.</p>
            <button type="button" class="btn btn-secondary btn-danger" id="deleteCardBtn">Delete this card</button>`;
        dangerSection.querySelector('#deleteCardBtn').addEventListener('click', deletePublishedCard);
        fieldEditor.appendChild(dangerSection);
    }

    photoSection.querySelector('#editorChangePhoto')?.addEventListener('click', () => {
        photoSection.querySelector('#editorPhotoInput').click();
    });
    photoSection.querySelector('#editorHideHeadshot')?.addEventListener('change', (event) => {
        cardData.hideHeadshot = event.target.checked;
        renderCardPreview();
        buildFieldEditor();
    });
    bindEditorPhotoEvents(photoSection);
}

function contactValueFieldHtml(def, data, attrs = {}) {
    const placeholder = def.placeholder || '';
    const classAttr = attrs.className ? ` class="${attrs.className}"` : '';
    const idAttr = attrs.id ? ` id="${attrs.id}"` : '';

    if (def.inputType === 'textarea') {
        return `<textarea${classAttr}${idAttr} rows="3" placeholder="${escapeAttr(placeholder)}">${escapeHtml(data.value || '')}</textarea>`;
    }

    return `<input type="${def.inputType || 'text'}"${classAttr}${idAttr} value="${escapeAttr(data.value || '')}" placeholder="${escapeAttr(placeholder)}">`;
}

function createFieldControl(fieldId) {
    const def = CardFields.getDefinition(fieldId);
    const wrap = document.createElement('div');
    wrap.className = 'form-field';

    if (def.type === 'contact') {
        const data = cardData[fieldId] || { value: '', label: def.defaultLabel };
        wrap.innerHTML = `
            <label for="field-${fieldId}">${def.label}${def.required ? ' <span class="required">*</span>' : ''}</label>
            ${contactValueFieldHtml(def, data, { id: `field-${fieldId}` })}
            <label class="sub-label" for="field-${fieldId}-label">Label</label>
            <select id="field-${fieldId}-label">${def.labelOptions.map((o) => `<option value="${o}"${data.label === o ? ' selected' : ''}>${o}</option>`).join('')}</select>`;

        wrap.querySelector(`#field-${fieldId}`).addEventListener('input', (e) => {
            cardData[fieldId].value = e.target.value;
            renderCardPreview();
        });
        wrap.querySelector(`#field-${fieldId}-label`).addEventListener('change', (e) => {
            cardData[fieldId].label = e.target.value;
            renderCardPreview();
        });
        return wrap;
    }

    wrap.innerHTML = `
        <label for="field-${fieldId}">${def.label}${def.required ? ' <span class="required">*</span>' : ''}</label>
        <input type="text" id="field-${fieldId}" value="${escapeAttr(cardData[fieldId] || '')}" placeholder="${def.placeholder || ''}">`;
    wrap.querySelector('input').addEventListener('input', (e) => {
        cardData[fieldId] = e.target.value;
        renderCardPreview();
    });
    return wrap;
}

function createOptionalFieldBlock(def) {
    const block = document.createElement('div');
    block.className = `field-toggle-block${cardData.enabled[def.id] ? ' is-enabled' : ''}`;

    const header = document.createElement('label');
    header.className = 'field-toggle-header';
    header.innerHTML = `
        <input type="checkbox" class="field-enable-toggle" data-field="${def.id}"${cardData.enabled[def.id] ? ' checked' : ''}>
        <span>${def.label}</span>`;

    const body = document.createElement('div');
    body.className = `field-toggle-body${cardData.enabled[def.id] ? '' : ' hidden'}`;

    if (def.type === 'text') {
        body.innerHTML = `<input type="text" class="field-optional-input" data-field="${def.id}" value="${escapeAttr(cardData[def.id] || '')}" placeholder="${def.placeholder || ''}">`;
        body.querySelector('input').addEventListener('input', (e) => {
            cardData[def.id] = e.target.value;
            renderCardPreview();
        });
    } else if (def.type === 'contact') {
        const data = cardData[def.id];
        body.innerHTML = `
            ${contactValueFieldHtml(def, data, { className: 'field-optional-input', id: `field-optional-${def.id}` })}
            <label class="sub-label">Label</label>
            <select data-field="${def.id}-label">${def.labelOptions.map((o) => `<option value="${o}"${data.label === o ? ' selected' : ''}>${o}</option>`).join('')}</select>`;
        body.querySelector('.field-optional-input').addEventListener('input', (e) => {
            cardData[def.id].value = e.target.value;
            renderCardPreview();
        });
        body.querySelector('select').addEventListener('change', (e) => {
            cardData[def.id].label = e.target.value;
            renderCardPreview();
        });
    } else if (def.type === 'link') {
        const data = cardData[def.id];
        body.innerHTML = `
            <input type="text" class="field-optional-input" data-field="${def.id}" value="${escapeAttr(data.value)}" placeholder="${def.placeholder || ''}">
            <label class="sub-label">Display as</label>
            <div class="display-mode-options">
                <label class="display-mode-option"><input type="radio" name="display-${def.id}" value="url"${data.displayMode === 'url' ? ' checked' : ''}> URL</label>
                <label class="display-mode-option"><input type="radio" name="display-${def.id}" value="custom"${data.displayMode !== 'url' ? ' checked' : ''}> Custom text</label>
            </div>
            <input type="text" class="field-custom-label${data.displayMode === 'url' ? ' hidden' : ''}" data-field="${def.id}-custom" value="${escapeAttr(data.customLabel)}" placeholder="${def.defaultDisplay || ''}">`;

        body.querySelector('input[data-field]').addEventListener('input', (e) => {
            cardData[def.id].value = e.target.value;
            renderCardPreview();
        });
        body.querySelectorAll(`input[name="display-${def.id}"]`).forEach((radio) => {
            radio.addEventListener('change', (e) => {
                cardData[def.id].displayMode = e.target.value;
                body.querySelector('.field-custom-label').classList.toggle('hidden', e.target.value === 'url');
                renderCardPreview();
            });
        });
        body.querySelector('.field-custom-label').addEventListener('input', (e) => {
            cardData[def.id].customLabel = e.target.value;
            renderCardPreview();
        });
    }

    header.querySelector('input').addEventListener('change', (e) => {
        cardData.enabled[def.id] = e.target.checked;
        body.classList.toggle('hidden', !e.target.checked);
        block.classList.toggle('is-enabled', e.target.checked);
        renderCardPreview();
    });

    block.appendChild(header);
    block.appendChild(body);
    return block;
}

function showHome() {
    homeSection.classList.remove('hidden');
    templateSelectionSection.classList.add('hidden');
    editorSection.classList.add('hidden');
    document.body.classList.remove('editor-open');
    startOverBtn.classList.add('hidden');
    downloadDropdown.classList.add('hidden');
    syncBasicsFormFromData();
}

function syncBasicsFormFromData() {
    document.getElementById('fullName').value = cardData.fullName;
    document.getElementById('jobTitle').value = cardData.jobTitle;
    document.getElementById('email').value = cardData.email?.value || '';
}

function showTemplateSelection() {
    homeSection.classList.add('hidden');
    templateSelectionSection.classList.remove('hidden');
    editorSection.classList.add('hidden');
    document.body.classList.remove('editor-open');
    startOverBtn.classList.add('hidden');
    downloadDropdown.classList.add('hidden');
}

function proceedToEditor() {
    homeSection.classList.add('hidden');
    templateSelectionSection.classList.add('hidden');
    editorSection.classList.remove('hidden');
    document.body.classList.add('editor-open');
    startOverBtn.classList.remove('hidden');
    downloadDropdown.classList.remove('hidden');
    cardData.templateId = currentTemplate;
    buildFieldEditor();
    renderCardPreview();
    generateQR();
    updateShareMenuState();
}

function clearAppState() {
    cardData = CardFields.createDefaultCardData();
    currentTemplate = 'sojern';
    publishState = { slug: null, editKey: null, shareUrl: null, contactUrl: null, editUrl: null, published: false };
    duplicateCreateConfirmed = false;
    duplicateConfirmedForEmail = null;
    pendingBasicsAfterDuplicate = null;
    updateShareMenuState();
    basicsForm.reset();
    cardData.photoSourceUrl = null;
    cardData.photoCrop = null;
    cardData.hideHeadshot = false;
    renderTemplateGrid();
}

function resetApp() {
    clearAppState();
    showHome();
    showToast('Started over', 'success');
}

function returnToHomeAfterDelete() {
    clearAppState();
    showHome();
    window.history.replaceState({}, '', window.location.pathname);
}

function renderCardPreview() {
    CardTemplates.render(cardPreviewMount, currentTemplate, cardData);
}

function isStagingOrigin(origin) {
    try {
        const host = new URL(origin).hostname;
        return host.includes('cosmic.webflow.services')
            || host.includes('.webflow.io')
            || host.endsWith('.workers.dev');
    } catch {
        return false;
    }
}

/** Ensure card links always use the production Design Hub domain. */
function normalizePublishedUrls(result) {
    const base = `${CARD_PUBLIC_ORIGIN}/business-card`;
    const needsFix = !result.shareUrl
        || isStagingOrigin(result.shareUrl)
        || result.shareUrl.includes('cosmic.webflow');
    if (!needsFix) {
        return {
            shareUrl: result.shareUrl,
            contactUrl: result.contactUrl,
            editUrl: result.editUrl
        };
    }
    return {
        shareUrl: `${base}/${result.slug}/share`,
        contactUrl: `${base}/${result.slug}`,
        editUrl: `${base}/?edit=${result.slug}&key=${result.editKey}`
    };
}

/** QR encodes the contact page — what prospects see when they scan. */
function getContactUrl() {
    if (publishState.contactUrl) return publishState.contactUrl;
    const slug = publishState.slug || slugify(cardData.fullName || 'preview');
    const origin = isStagingOrigin(window.location.origin) ? CARD_PUBLIC_ORIGIN : window.location.origin;
    return `${origin}/business-card/${slug}`;
}

function generateQR() {
    if (!qrCanvas) return;
    if (typeof QRCode === 'undefined') {
        console.warn('QRCode library not loaded');
        return;
    }
    const url = getContactUrl();
    QRCode.toCanvas(
        qrCanvas,
        url,
        {
            width: 140,
            margin: 1,
            color: { dark: '#242452', light: '#ffffff' }
        },
        (err) => {
            if (err) {
                console.warn('QR generation failed', err);
                showToast('Could not generate QR code', 'error');
            }
        }
    );
}

function bindShareActions() {
    publishBtn?.addEventListener('click', publishCard);
    copyPublicLinkBtn?.addEventListener('click', () => {
        if (!publishState.shareUrl) return;
        copyToClipboard(publishState.shareUrl, 'My card link copied');
        downloadDropdown.classList.remove('open');
    });
    saveQrBtn?.addEventListener('click', saveQrToPhotos);
    addToHomeBtn?.addEventListener('click', () => {
        if (!publishState.shareUrl) return;
        openHomeScreenGuideModal(publishState.shareUrl);
        downloadDropdown.classList.remove('open');
    });
    document.getElementById('downloadVcfBtn')?.addEventListener('click', downloadVcf);
}

function compressPhotoForPublish(dataUrl) {
    if (!dataUrl) return Promise.resolve(null);
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const size = 400;
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            const scale = Math.max(size / img.width, size / img.height);
            const w = img.width * scale;
            const h = img.height * scale;
            ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.88));
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });
}

async function prepareCardDataForPublish() {
    const payload = structuredClone(cardData);
    if (payload.photoDataUrl) {
        payload.photoDataUrl = await compressPhotoForPublish(payload.photoDataUrl);
    }
    return payload;
}

async function publishCard() {
    publishBtn.disabled = true;
    const originalLabel = publishBtn.textContent;
    publishBtn.textContent = publishState.published ? 'Updating…' : 'Publishing…';

    try {
        const publishEmail = cardData.email?.value?.trim();
        const emailAlreadyConfirmed = duplicateCreateConfirmed && duplicateConfirmedForEmail === publishEmail;
        if (!publishState.published && !emailAlreadyConfirmed) {
            const duplicateCheck = await checkEmailForDuplicates(
                publishEmail,
                cardData.fullName?.trim()
            );
            if (duplicateCheck?.hasExisting) {
                showDuplicateEmailModal(duplicateCheck, cardData.email?.value?.trim(), { onCreateAnother: publishCard });
                return;
            }
        }

        const payload = await prepareCardDataForPublish();
        const response = await fetch('/business-card/api/cards/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cardData: payload,
                templateId: currentTemplate,
                slug: publishState.slug || undefined,
                editKey: publishState.editKey || undefined
            })
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Publish failed');
        }

        const urls = normalizePublishedUrls(result);
        publishState = {
            slug: result.slug,
            editKey: result.editKey,
            shareUrl: urls.shareUrl,
            contactUrl: urls.contactUrl,
            editUrl: urls.editUrl,
            published: true
        };

        generateQR();
        updateShareMenuState();
        showPublishModal(result.updated);
        downloadDropdown.classList.remove('open');
        showToast(result.updated ? 'Card updated' : 'Card published', 'success');
    } catch (error) {
        console.error(error);
        showToast(error.message || 'Could not publish card', 'error');
    } finally {
        publishBtn.disabled = false;
        publishBtn.textContent = originalLabel;
        updateShareMenuState();
    }
}

function showPublishModal(updated) {
    document.getElementById('publishModalTitle').textContent = updated ? 'Card updated' : 'Card published';
    document.getElementById('shareUrlInput').value = publishState.shareUrl || '';
    document.getElementById('contactUrlInput').value = publishState.contactUrl || '';
    refreshHomeScreenGuides(publishState.shareUrl);
    publishModal?.classList.remove('hidden');
}

function openHomeScreenGuideModal(shareUrl, options = {}) {
    HomeScreenGuide.mount(document.getElementById('homeScreenGuideModalMount'), { shareUrl });
    addToHomeModal?.classList.remove('hidden');
    addToHomeModal?.classList.toggle('modal-overlay--stacked', Boolean(options.stack));
}

function refreshHomeScreenGuides(shareUrl) {
    const publishMount = document.getElementById('homeScreenGuidePublishMount');
    if (publishMount) HomeScreenGuide.mount(publishMount, { shareUrl });
}

function updateShareMenuState() {
    const isPublished = publishState.published;
    if (publishBtn) {
        publishBtn.textContent = isPublished ? 'Update Card' : 'Publish Card';
    }
    if (publishHint) {
        publishHint.textContent = isPublished
            ? 'Your card is live. Use Home Screen setup guide for iPhone and Android steps.'
            : 'Save your card online to get your card link, contact page, and QR code.';
    }
    if (qrHint) {
        qrHint.textContent = isPublished
            ? 'QR links to your contact page for prospects'
            : 'Publish your card to activate this QR code';
    }
    [copyPublicLinkBtn, saveQrBtn, addToHomeBtn].forEach((btn) => {
        if (btn) btn.disabled = !isPublished;
    });
}

function loadCardIntoEditor(result, successMessage = 'Loaded your published card for editing') {
    cardData = result.cardData;
    currentTemplate = result.templateId || 'sojern';
    const urls = normalizePublishedUrls(result);
    publishState = {
        slug: result.slug,
        editKey: result.editKey,
        shareUrl: urls.shareUrl,
        contactUrl: urls.contactUrl,
        editUrl: urls.editUrl,
        published: true
    };

    templateUserName.textContent = cardData.fullName || 'your card';
    cardData.hideHeadshot = Boolean(cardData.hideHeadshot);
    proceedToEditor();
    showToast(successMessage, 'success');
    window.history.replaceState({}, '', window.location.pathname);
}

async function loadEditFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const magicToken = params.get('token');
    const slug = params.get('edit');
    const key = params.get('key');

    if (magicToken) {
        try {
            const response = await fetch('/business-card/api/cards/verify-magic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: magicToken })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Could not verify edit link');
            loadCardIntoEditor(result, 'Secure edit link accepted');
        } catch (error) {
            console.error(error);
            showToast(error.message || 'Could not open edit link', 'error');
        }
        return;
    }

    if (!slug || !key) return;

    try {
        const response = await fetch(`/business-card/api/cards/${encodeURIComponent(slug)}?key=${encodeURIComponent(key)}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not load card');
        loadCardIntoEditor(result);
    } catch (error) {
        console.error(error);
        showToast(error.message || 'Could not load card for editing', 'error');
    }
}

async function checkEmailForDuplicates(email, fullName) {
    if (!email || !fullName) return null;

    const response = await fetch('/business-card/api/cards/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email,
            fullName,
            excludeSlug: publishState.slug || undefined
        })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not check email');
    return result;
}

function showDuplicateEmailModal(check, email, options = {}) {
    const modal = document.getElementById('duplicateEmailModal');
    const listEl = document.getElementById('duplicateEmailList');
    const slugEl = document.getElementById('duplicateProposedSlug');
    const urlEl = document.getElementById('duplicateProposedUrl');

    if (listEl) {
        listEl.innerHTML = check.cards.map((card) => `
            <div class="duplicate-email-item">
                <h3>${escapeHtml(card.fullName)}</h3>
                <p>${escapeHtml(card.jobTitle)}</p>
                <p><code>${escapeHtml(card.slug)}</code> · Last edited ${escapeHtml(formatRecoverTimestamp(card.updatedAt))}</p>
            </div>`).join('');
    }

    if (slugEl) slugEl.textContent = check.proposedSlug;
    if (urlEl) urlEl.textContent = check.proposedContactUrl || '';

    pendingBasicsAfterDuplicate = {
        email,
        onCreateAnother: options.onCreateAnother || null
    };
    modal?.classList.remove('hidden');
}

function bindDuplicateEmailModal() {
    const modal = document.getElementById('duplicateEmailModal');
    const close = () => {
        pendingBasicsAfterDuplicate = null;
        modal?.classList.add('hidden');
    };

    document.getElementById('closeDuplicateEmailModal')?.addEventListener('click', close);
    modal?.addEventListener('click', (event) => {
        if (event.target === modal) close();
    });

    document.getElementById('duplicateFindCardBtn')?.addEventListener('click', () => {
        const email = pendingBasicsAfterDuplicate?.email || cardData.email?.value?.trim();
        close();
        resetRecoverModal();
        document.getElementById('recoverModal')?.classList.remove('hidden');
        if (email) document.getElementById('recoverEmail').value = email;
    });

    document.getElementById('duplicateCreateAnotherBtn')?.addEventListener('click', async () => {
        const pending = pendingBasicsAfterDuplicate;
        duplicateCreateConfirmed = true;
        duplicateConfirmedForEmail = pending?.email || cardData.email?.value?.trim() || null;
        close();

        if (typeof pending?.onCreateAnother === 'function') {
            await pending.onCreateAnother();
            return;
        }

        showTemplateSelection();
    });
}

async function requestEditLink(email, slug) {
    const response = await fetch('/business-card/api/cards/request-edit-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, slug })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not send edit link');
    return result.message;
}

async function requestDeleteLink(email, slug) {
    const response = await fetch('/business-card/api/cards/request-delete-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, slug })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not send delete confirmation');
    return result.message;
}

let pendingDeleteToken = null;

function bindDeleteConfirmModal() {
    const modal = document.getElementById('deleteConfirmModal');
    const close = () => {
        pendingDeleteToken = null;
        modal?.classList.add('hidden');
    };

    document.getElementById('closeDeleteConfirmModal')?.addEventListener('click', close);
    document.getElementById('cancelDeleteConfirmBtn')?.addEventListener('click', close);
    modal?.addEventListener('click', (event) => {
        if (event.target === modal) close();
    });

    document.getElementById('confirmDeleteBtn')?.addEventListener('click', async () => {
        if (!pendingDeleteToken) return;
        const btn = document.getElementById('confirmDeleteBtn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Deleting…';
        }

        try {
            const response = await fetch('/business-card/api/cards/confirm-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: pendingDeleteToken })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Could not delete card');
            close();
            showToast(`${result.fullName || 'Card'} deleted permanently`, 'success');
        } catch (error) {
            showToast(error.message || 'Could not delete card', 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Delete permanently';
            }
        }
    });
}

async function loadDeleteFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const deleteToken = params.get('delete');
    if (!deleteToken) return;

    const modal = document.getElementById('deleteConfirmModal');
    const textEl = document.getElementById('deleteConfirmText');

    try {
        const response = await fetch('/business-card/api/cards/preview-delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: deleteToken })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Invalid delete link');

        pendingDeleteToken = deleteToken;
        if (textEl) {
            textEl.textContent = `Permanently delete ${result.fullName}'s card? All links and QR codes will stop working. This cannot be undone.`;
        }
        modal?.classList.remove('hidden');
        window.history.replaceState({}, '', window.location.pathname);
    } catch (error) {
        console.error(error);
        showToast(error.message || 'Could not open delete link', 'error');
        window.history.replaceState({}, '', window.location.pathname);
    }
}

async function rotateEditKey() {
    if (!publishState.slug || !publishState.editKey) return;
    if (!confirm('Invalidate all previously saved edit links? You can request a new link via Find my card.')) return;

    const btn = document.getElementById('rotateEditKeyBtn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Invalidating…';
    }

    try {
        const response = await fetch('/business-card/api/cards/rotate-edit-key', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                slug: publishState.slug,
                editKey: publishState.editKey
            })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not invalidate edit links');
        publishState.editKey = result.editKey;
        publishState.editUrl = `${CARD_PUBLIC_ORIGIN}/business-card/?edit=${publishState.slug}&key=${result.editKey}`;
        showToast('Old edit links invalidated', 'success');
    } catch (error) {
        showToast(error.message || 'Could not invalidate edit links', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Invalidate old edit links';
        }
    }
}

function copyText(inputId, successMessage) {
    const input = document.getElementById(inputId);
    if (!input?.value) return;
    copyToClipboard(input.value, successMessage);
}

async function copyToClipboard(text, successMessage) {
    try {
        await navigator.clipboard.writeText(text);
        showToast(successMessage, 'success');
    } catch {
        showToast('Could not copy — select and copy manually', 'error');
    }
}

function resetRecoverModal() {
    const recoverForm = document.getElementById('recoverForm');
    const resultsEl = document.getElementById('recoverResults');

    recoverForm?.reset();
    if (resultsEl) {
        resultsEl.classList.add('hidden');
        resultsEl.innerHTML = '';
    }
}

function bindRecoverModal() {
    const recoverModal = document.getElementById('recoverModal');
    const recoverForm = document.getElementById('recoverForm');

    document.getElementById('findCardBtn')?.addEventListener('click', () => {
        resetRecoverModal();
        recoverModal?.classList.remove('hidden');
        const email = document.getElementById('email')?.value?.trim();
        if (email) document.getElementById('recoverEmail').value = email;
    });

    document.getElementById('closeRecoverModal')?.addEventListener('click', () => {
        recoverModal?.classList.add('hidden');
        resetRecoverModal();
    });

    recoverModal?.addEventListener('click', (e) => {
        if (e.target === recoverModal) {
            recoverModal.classList.add('hidden');
            resetRecoverModal();
        }
    });

    recoverForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('recoverEmail').value.trim();
        const resultsEl = document.getElementById('recoverResults');
        const submitBtn = recoverForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Looking up…';

        try {
            const response = await fetch('/business-card/api/cards/recover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Lookup failed');

            resultsEl.classList.remove('hidden');
            resultsEl.innerHTML = '';

            result.cards.forEach((card) => {
                const item = document.createElement('div');
                item.className = 'recover-card-item';
                item.innerHTML = `
                    <h3>${escapeHtml(card.fullName)}</h3>
                    <p class="recover-card-meta">${escapeHtml(card.jobTitle)}</p>
                    <p class="recover-card-meta">Last edited: ${escapeHtml(formatRecoverTimestamp(card.updatedAt))}</p>
                    <p class="recover-card-slug"><span class="recover-card-label">URL slug</span> <code>${escapeHtml(card.slug)}</code></p>
                    <div class="recover-card-links">
                        <div class="recover-card-link-row">
                            <span class="recover-card-label">Contact page</span>
                            <a class="recover-card-link" href="${escapeHtml(card.contactUrl)}" target="_blank" rel="noopener">${escapeHtml(card.contactUrl)}</a>
                        </div>
                        <div class="recover-card-link-row">
                            <span class="recover-card-label">My card</span>
                            <a class="recover-card-link" href="${escapeHtml(card.shareUrl)}" target="_blank" rel="noopener">${escapeHtml(card.shareUrl)}</a>
                        </div>
                    </div>
                    <div class="recover-card-actions">
                        <button type="button" class="btn btn-primary" data-action="request-edit">Email me an edit link</button>
                        <button type="button" class="btn btn-secondary" data-action="copy-contact">Copy contact link</button>
                        <button type="button" class="btn btn-secondary" data-action="copy-share">Copy my card link</button>
                        <button type="button" class="btn btn-secondary" data-action="home-screen">Home Screen setup</button>
                        <button type="button" class="btn btn-secondary btn-danger" data-action="request-delete">Email delete confirmation</button>
                    </div>`;

                item.querySelector('[data-action="request-edit"]').addEventListener('click', async (event) => {
                    const btn = event.currentTarget;
                    const originalText = btn.textContent;
                    btn.disabled = true;
                    btn.textContent = 'Sending…';
                    try {
                        const message = await requestEditLink(email, card.slug);
                        showToast(message, 'success');
                    } catch (error) {
                        showToast(error.message || 'Could not send edit link', 'error');
                    } finally {
                        btn.disabled = false;
                        btn.textContent = originalText;
                    }
                });
                item.querySelector('[data-action="copy-contact"]').addEventListener('click', () => {
                    copyToClipboard(card.contactUrl, 'Contact link copied');
                });
                item.querySelector('[data-action="copy-share"]').addEventListener('click', () => {
                    copyToClipboard(card.shareUrl, 'My card link copied');
                });
                item.querySelector('[data-action="home-screen"]').addEventListener('click', () => {
                    openHomeScreenGuideModal(card.shareUrl, { stack: true });
                });
                item.querySelector('[data-action="request-delete"]').addEventListener('click', async (event) => {
                    const btn = event.currentTarget;
                    const originalText = btn.textContent;
                    btn.disabled = true;
                    btn.textContent = 'Sending…';
                    try {
                        const message = await requestDeleteLink(email, card.slug);
                        showToast(message, 'success');
                    } catch (error) {
                        showToast(error.message || 'Could not send delete confirmation', 'error');
                    } finally {
                        btn.disabled = false;
                        btn.textContent = originalText;
                    }
                });

                resultsEl.appendChild(item);
            });
        } catch (error) {
            resultsEl.classList.remove('hidden');
            resultsEl.innerHTML = `<p class="helper-text">${escapeHtml(error.message)}</p>`;
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Look up cards';
        }
    });
}

function escapeHtml(str) {
    return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatRecoverTimestamp(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

async function deleteCardBySlug(slug, editKey) {
    if (!slug || !editKey) throw new Error('Missing card credentials');

    const response = await fetch('/business-card/api/cards/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, editKey })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `Delete failed (${response.status})`);
}

async function deletePublishedCard() {
    if (!publishState.slug || !publishState.editKey) return;
    if (!confirm('Delete this card permanently? All links and QR codes will stop working.')) return;

    const btn = document.getElementById('deleteCardBtn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Deleting…';
    }

    try {
        await deleteCardBySlug(publishState.slug, publishState.editKey);
        returnToHomeAfterDelete();
        showToast('Card deleted', 'success');
    } catch (error) {
        showToast(error.message || 'Could not delete card', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Delete this card';
        }
    }
}

function saveQrToPhotos() {
    if (!qrCanvas || !publishState.published) {
        showToast('Publish your card first to save a working QR code', 'error');
        return;
    }
    const link = document.createElement('a');
    link.download = `${slugify(cardData.fullName || 'contact')}-qr.png`;
    link.href = qrCanvas.toDataURL('image/png');
    link.click();
    downloadDropdown.classList.remove('open');
    showToast('QR code downloaded — save to Photos from your downloads', 'success');
}

function downloadVcf() {
    const vcf = buildVCard();
    const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${slugify(cardData.fullName || 'contact')}.vcf`;
    link.click();
    URL.revokeObjectURL(link.href);
    downloadDropdown.classList.remove('open');
    showToast('Contact file downloaded', 'success');
}

function buildVCard() {
    const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${cardData.fullName}`, `TITLE:${cardData.jobTitle}`, `ORG:${CardFields.COMPANY_NAME}`];
    const contactType = (label) => (CardFields.showContactLabel(label) ? `;TYPE=${label}` : '');
    if (cardData.email?.value) lines.push(`EMAIL${contactType(cardData.email.label)}:${cardData.email.value}`);
    if (cardData.enabled.phone && cardData.phone?.value) lines.push(`TEL${contactType(cardData.phone.label)}:${cardData.phone.value}`);
    if (cardData.enabled.address && cardData.address?.value) lines.push(`ADR${contactType(cardData.address.label)}:;;${cardData.address.value};;;;`);
    if (cardData.enabled.companyUrl && cardData.companyUrl?.value) {
        const url = cardData.companyUrl.value.startsWith('http') ? cardData.companyUrl.value : `https://${cardData.companyUrl.value}`;
        lines.push(`URL:${url}`);
    }
    if (cardData.enabled.linkedin && cardData.linkedin?.value) lines.push(`URL:${cardData.linkedin.value}`);
    if (cardData.enabled.calendly && cardData.calendly?.value) lines.push(`URL:${cardData.calendly.value}`);
    lines.push('END:VCARD');
    return lines.join('\r\n');
}

function slugify(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'card';
}

function escapeAttr(str) {
    return String(str ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}
