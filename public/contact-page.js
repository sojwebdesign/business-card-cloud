/**
 * Save to Contacts — opens the device contact sheet with name, photo, and fields.
 */
async function saveToContacts(vcfUrl, fullName) {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
        || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // iOS Safari opens the Add Contact sheet when navigating to a vCard URL
    if (isIOS) {
        window.location.assign(vcfUrl);
        return;
    }

    const response = await fetch(vcfUrl);
    if (!response.ok) throw new Error('Could not load contact file');

    const vcf = await response.text();
    const filename = `${(fullName || 'contact').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.vcf`;
    const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8' });
    const file = new File([blob], filename, { type: 'text/vcard' });

    if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
        return;
    }

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
