(function () {
    const saved = localStorage.getItem('digicard-theme');
    const theme = saved === 'dark' || saved === 'light'
        ? saved
        : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    window.DigiCardBrand?.applyFavicon(theme);

    document.querySelectorAll('.help-faq-item').forEach((item) => {
        if (window.location.hash && item.id === window.location.hash.slice(1)) {
            item.open = true;
        }
    });
})();
