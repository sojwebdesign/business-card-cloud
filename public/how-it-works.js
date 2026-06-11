(function () {
    const saved = localStorage.getItem('digicard-theme');
    const theme = saved === 'dark' || saved === 'light'
        ? saved
        : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    window.DigiCardBrand?.applyFavicon(theme);

    const faqItems = [...document.querySelectorAll('.help-faq-item')];
    const faqIds = new Set(faqItems.map((item) => item.id).filter(Boolean));

    function scrollToElement(element) {
        if (!element) return;
        const headerOffset = 24;
        const top = element.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({ top, behavior: 'smooth' });
    }

    function openAndScrollTo(id, { updateHash = true } = {}) {
        if (id === 'help-top') {
            scrollToElement(document.getElementById('help-top'));
            if (updateHash) {
                history.replaceState(null, '', '#help-top');
            }
            return;
        }

        const item = document.getElementById(id);
        if (!item || !faqIds.has(id)) return;

        item.open = true;
        requestAnimationFrame(() => {
            scrollToElement(item);
        });

        if (updateHash) {
            history.replaceState(null, '', `#${id}`);
        }
    }

    document.querySelector('.help-page')?.addEventListener('click', (event) => {
        const link = event.target.closest('a[href^="#"]');
        if (!link) return;

        const id = link.getAttribute('href')?.slice(1);
        if (!id || (!faqIds.has(id) && id !== 'help-top')) return;

        event.preventDefault();
        openAndScrollTo(id);
    });

    const initialHash = window.location.hash.slice(1);
    if (initialHash && (faqIds.has(initialHash) || initialHash === 'help-top')) {
        requestAnimationFrame(() => {
            openAndScrollTo(initialHash, { updateHash: false });
        });
    }

    window.addEventListener('hashchange', () => {
        const id = window.location.hash.slice(1);
        if (faqIds.has(id) || id === 'help-top') {
            openAndScrollTo(id, { updateHash: false });
        }
    });
})();
