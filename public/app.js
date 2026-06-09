/**
 * Contact Card Builder
 * Flow: basics → template → editor (field customization + preview)
 */

let cardData = CardFields.createDefaultCardData();
let currentTemplate = 'sojern';
let publishState = {
    slug: null,
    editKey: null,
    publicUrl: null,
    editUrl: null,
    published: false
};

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
const photoInput = document.getElementById('photoInput');
const photoUpload = document.getElementById('photoUpload');
const photoUploadContent = document.getElementById('photoUploadContent');
const photoPreview = document.getElementById('photoPreview');
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

init();

function init() {
    renderTemplateGrid();
    bindTheme();
    bindDownloadMenu();
    bindBasicsForm();
    bindNavigation();
    bindPhotoUpload();
    bindShareActions();
    bindModal();
    bindPublishModal();
    loadEditFromUrl();
}

function bindTheme() {
    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        themeToggle.querySelectorAll('.theme-toggle-option').forEach((opt) => {
            opt.classList.toggle('active', opt.dataset.theme === next);
        });
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
    closeHomeModal?.addEventListener('click', () => addToHomeModal.classList.add('hidden'));
    addToHomeModal?.addEventListener('click', (e) => {
        if (e.target === addToHomeModal) addToHomeModal.classList.add('hidden');
    });
}

function bindPublishModal() {
    document.getElementById('closePublishModal')?.addEventListener('click', () => publishModal.classList.add('hidden'));
    publishModal?.addEventListener('click', (e) => {
        if (e.target === publishModal) publishModal.classList.add('hidden');
    });
    document.getElementById('publishDoneBtn')?.addEventListener('click', () => publishModal.classList.add('hidden'));
    document.getElementById('copyPublicUrlBtn')?.addEventListener('click', () => copyText('publicUrlInput', 'Public link copied'));
    document.getElementById('copyEditUrlBtn')?.addEventListener('click', () => copyText('editUrlInput', 'Edit link copied'));
    document.getElementById('publishSaveQrBtn')?.addEventListener('click', saveQrToPhotos);
}

function bindBasicsForm() {
    basicsForm.addEventListener('submit', (e) => {
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
        showTemplateSelection();
    });
}

function bindNavigation() {
    document.getElementById('templateBackBtn').addEventListener('click', showHome);
    document.getElementById('templateContinueBtn').addEventListener('click', proceedToEditor);
    startOverBtn.addEventListener('click', resetApp);
}

function bindPhotoUpload() {
    photoUpload.addEventListener('click', () => photoInput.click());
    photoInput.addEventListener('change', handlePhotoChange);
}

function handlePhotoChange() {
    const file = photoInput.files?.[0];
    if (!file) return;
    readPhotoFile(file, () => {
        syncBasicsPhotoUI();
        if (!editorSection.classList.contains('hidden')) {
            renderCardPreview();
            buildFieldEditor();
        }
    });
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
            syncBasicsPhotoUI();
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

function syncBasicsPhotoUI() {
    if (cardData.photoDataUrl) {
        photoPreview.src = cardData.photoDataUrl;
        photoPreview.classList.remove('hidden');
        photoUploadContent.classList.add('hidden');
    }
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
                <div class="template-thumb ${tpl.thumbClass}"></div>
            </div>
            <span class="effect-option-label">${tpl.name}</span>`;
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
    photoSection.innerHTML = `
        <h3 class="sidebar-title">Headshot</h3>
        <p class="helper-text">Upload then drag and zoom to set the focal point.</p>
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

    photoSection.querySelector('#editorChangePhoto')?.addEventListener('click', () => {
        photoSection.querySelector('#editorPhotoInput').click();
    });
    bindEditorPhotoEvents(photoSection);
}

function createFieldControl(fieldId) {
    const def = CardFields.getDefinition(fieldId);
    const wrap = document.createElement('div');
    wrap.className = 'form-field';

    if (def.type === 'contact') {
        const data = cardData[fieldId] || { value: '', label: def.defaultLabel };
        wrap.innerHTML = `
            <label for="field-${fieldId}">${def.label}${def.required ? ' <span class="required">*</span>' : ''}</label>
            <input type="${def.inputType || 'text'}" id="field-${fieldId}" value="${escapeAttr(data.value)}" placeholder="${def.placeholder || ''}">
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
            <input type="${def.inputType || 'text'}" class="field-optional-input" data-field="${def.id}" value="${escapeAttr(data.value)}" placeholder="${def.placeholder || ''}">
            <label class="sub-label">Label</label>
            <select data-field="${def.id}-label">${def.labelOptions.map((o) => `<option value="${o}"${data.label === o ? ' selected' : ''}>${o}</option>`).join('')}</select>`;
        body.querySelector('input').addEventListener('input', (e) => {
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

function resetApp() {
    cardData = CardFields.createDefaultCardData();
    currentTemplate = 'sojern';
    publishState = { slug: null, editKey: null, publicUrl: null, editUrl: null, published: false };
    updateShareMenuState();
    basicsForm.reset();
    photoPreview.classList.add('hidden');
    photoUploadContent.classList.remove('hidden');
    photoInput.value = '';
    cardData.photoSourceUrl = null;
    cardData.photoCrop = null;
    renderTemplateGrid();
    showHome();
    showToast('Started over', 'success');
}

function renderCardPreview() {
    CardTemplates.render(cardPreviewMount, currentTemplate, cardData);
}

function getCardShareUrl() {
    const slug = publishState.slug || slugify(cardData.fullName || 'preview');
    return `${window.location.origin}/business-card/c/${slug}`;
}

function generateQR() {
    if (!qrCanvas) return;
    if (typeof QRCode === 'undefined') {
        console.warn('QRCode library not loaded');
        return;
    }
    const url = getCardShareUrl();
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
        if (!publishState.publicUrl) return;
        copyToClipboard(publishState.publicUrl, 'Public link copied');
        downloadDropdown.classList.remove('open');
    });
    saveQrBtn?.addEventListener('click', saveQrToPhotos);
    addToHomeBtn?.addEventListener('click', () => {
        if (!publishState.publicUrl) return;
        const link = document.getElementById('addToHomeCardLink');
        if (link) {
            link.href = publishState.publicUrl;
            link.textContent = 'your card link';
        }
        addToHomeModal?.classList.remove('hidden');
        downloadDropdown.classList.remove('open');
    });
    document.getElementById('downloadVcfBtn')?.addEventListener('click', downloadVcf);
}

async function publishCard() {
    publishBtn.disabled = true;
    const originalLabel = publishBtn.textContent;
    publishBtn.textContent = publishState.published ? 'Updating…' : 'Publishing…';

    try {
        const response = await fetch('/business-card/api/cards/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cardData,
                templateId: currentTemplate,
                slug: publishState.slug || undefined,
                editKey: publishState.editKey || undefined
            })
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Publish failed');
        }

        publishState = {
            slug: result.slug,
            editKey: result.editKey,
            publicUrl: result.publicUrl,
            editUrl: result.editUrl,
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
    document.getElementById('publicUrlInput').value = publishState.publicUrl || '';
    document.getElementById('editUrlInput').value = publishState.editUrl || '';
    publishModal?.classList.remove('hidden');
}

function updateShareMenuState() {
    const isPublished = publishState.published;
    if (publishBtn) {
        publishBtn.textContent = isPublished ? 'Update Card' : 'Publish Card';
    }
    if (publishHint) {
        publishHint.textContent = isPublished
            ? 'Your card is live. Update anytime — the public link stays the same.'
            : 'Save your card online to get a live link and QR code.';
    }
    if (qrHint) {
        qrHint.textContent = isPublished
            ? 'QR links to your live card'
            : 'Publish your card to activate this QR code';
    }
    [copyPublicLinkBtn, saveQrBtn, addToHomeBtn].forEach((btn) => {
        if (btn) btn.disabled = !isPublished;
    });
}

async function loadEditFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('edit');
    const key = params.get('key');
    if (!slug || !key) return;

    try {
        const response = await fetch(`/business-card/api/cards/${encodeURIComponent(slug)}?key=${encodeURIComponent(key)}`);
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Could not load card');
        }

        cardData = result.cardData;
        currentTemplate = result.templateId || 'sojern';
        publishState = {
            slug: result.slug,
            editKey: result.editKey,
            publicUrl: `${window.location.origin}/business-card/c/${result.slug}`,
            editUrl: `${window.location.origin}/business-card/?edit=${result.slug}&key=${result.editKey}`,
            published: true
        };

        templateUserName.textContent = cardData.fullName || 'your card';
        syncBasicsPhotoUI();
        proceedToEditor();
        showToast('Loaded your published card for editing', 'success');

        const cleanUrl = `${window.location.pathname}`;
        window.history.replaceState({}, '', cleanUrl);
    } catch (error) {
        console.error(error);
        showToast(error.message || 'Could not load card for editing', 'error');
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
    if (cardData.email?.value) lines.push(`EMAIL;TYPE=${cardData.email.label}:${cardData.email.value}`);
    if (cardData.enabled.phone && cardData.phone?.value) lines.push(`TEL;TYPE=${cardData.phone.label}:${cardData.phone.value}`);
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
