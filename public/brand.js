/** Sojern DigiCard brand asset paths */
window.DigiCardBrand = {
    faviconLight: '/business-card/Assets/DigiCard_Favicon_Light.png',
    faviconDark: '/business-card/Assets/DigiCard_Favicon_Dark.png',
    logoLight: '/business-card/Assets/DigiCard-Logo_Light.png',
    logoDark: '/business-card/Assets/DigiCard-Logo_Dark.png',

    applyFavicon(theme) {
        const resolved = theme === 'dark' ? this.faviconDark : this.faviconLight;
        let link = document.querySelector('link[data-brand-favicon]');
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            link.type = 'image/png';
            link.setAttribute('data-brand-favicon', '');
            document.head.appendChild(link);
        }
        link.href = resolved;
    }
};
