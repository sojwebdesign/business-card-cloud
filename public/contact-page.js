/**
 * Contact sharing helpers for contact and share pages.
 */

const scriptPromises = {};

function loadScript(src) {
    if (scriptPromises[src]) return scriptPromises[src];
    scriptPromises[src] = new Promise((resolve, reject) => {
        const el = document.createElement('script');
        el.src = src;
        el.onload = () => resolve();
        el.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(el);
    });
    return scriptPromises[src];
}

async function ensureQRCode() {
    if (typeof QRCode !== 'undefined') return;
    await loadScript('/business-card/vendor/qrcode.min.js');
}

async function fetchVCardFile(vcfUrl, fullName) {
    const response = await fetch(vcfUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error('Could not load contact file');

    const vcf = await response.text();
    const filename = `${(fullName || 'contact').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.vcf`;
    const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8' });
    const file = new File([blob], filename, { type: 'text/vcard' });
    return { file, filename, blob };
}

/** Share page — AirDrop / Messages to a nearby iPhone. */
async function shareContactFile(vcfUrl, fullName) {
    const { file } = await fetchVCardFile(vcfUrl, fullName);

    if (navigator.share) {
        try {
            if (navigator.canShare?.({ files: [file] })) {
                await navigator.share({ files: [file], title: fullName });
                return;
            }
            await navigator.share({
                title: fullName,
                text: `Contact card for ${fullName}`,
                url: vcfUrl
            });
            return;
        } catch (err) {
            if (err?.name === 'AbortError') return;
        }
    }

    const { blob, filename } = await fetchVCardFile(vcfUrl, fullName);
    downloadBlob(blob, filename);
}

function isMobileDevice() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
        || (navigator.userAgent.includes('Mac') && navigator.maxTouchPoints > 1);
}

/**
 * Contact page — open the native Add to Contacts flow (not the share sheet).
 * On iOS/Android, navigating to the vCard URL triggers the Contacts import UI.
 */
function openVCardImport(vcfUrl) {
    const link = document.createElement('a');
    link.href = vcfUrl;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
}

async function saveToContacts(vcfUrl, fullName) {
    if (isMobileDevice()) {
        openVCardImport(vcfUrl);
        return;
    }

    const { blob, filename } = await fetchVCardFile(vcfUrl, fullName);
    downloadBlob(blob, filename);
}

function downloadBlob(blob, filename) {
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
}
