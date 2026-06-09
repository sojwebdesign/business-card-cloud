/**
 * Contact sharing helpers for contact and share pages.
 */

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

/** Contact page — open Add Contact without trapping the user on the vCard page. */
async function saveToContacts(vcfUrl, fullName) {
    const { file, filename, blob } = await fetchVCardFile(vcfUrl, fullName);

    if (navigator.canShare?.({ files: [file] })) {
        try {
            await navigator.share({ files: [file], title: fullName });
            return;
        } catch (err) {
            if (err?.name === 'AbortError') return;
        }
    }

    const popup = window.open(vcfUrl, '_blank', 'noopener,noreferrer');
    if (popup) return;

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
