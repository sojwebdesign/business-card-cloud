/**
 * Reusable Add to Home Screen instructions for iPhone and Android.
 */
window.HomeScreenGuide = {
    APP_NAME: 'Sojern DigiCard',

    render(options = {}) {
        const { shareUrl = '', variant = 'full', linkId = '' } = options;
        const compact = variant === 'compact';
        const linkHtml = shareUrl
            ? `<p class="home-screen-guide__link-row">
                <span class="home-screen-guide__link-label">My card page</span>
                <a class="home-screen-guide__link" ${linkId ? `id="${linkId}"` : ''} href="${this.escapeAttr(shareUrl)}" target="_blank" rel="noopener">${this.escapeHtml(shareUrl)}</a>
               </p>`
            : `<p class="home-screen-guide__link-row home-screen-guide__link-row--pending">Publish your card first to get your <strong>My card</strong> link, then open that page on your phone.</p>`;

        const inner = `
            <p class="home-screen-guide__intro">Bookmark your <strong>My card</strong> page on your phone's Home Screen. You'll get one-tap access to your QR code at events. The shortcut is named <strong>${this.APP_NAME}</strong>.</p>
            ${linkHtml}
            <div class="home-screen-guide__tabs" role="tablist" aria-label="Choose your phone">
                <button type="button" class="home-screen-guide__tab is-active" role="tab" aria-selected="true" data-platform="iphone">iPhone</button>
                <button type="button" class="home-screen-guide__tab" role="tab" aria-selected="false" data-platform="android">Android</button>
            </div>
            <div class="home-screen-guide__panel is-active" role="tabpanel" data-platform="iphone">
                <ol class="home-screen-guide__steps">
                    <li>On your iPhone, open your <strong>My card</strong> link in <strong>Safari</strong> (Chrome and in-app browsers won't work).</li>
                    <li>Tap the <strong>Share</strong> button at the bottom of the screen (square with an arrow pointing up).</li>
                    <li>Scroll down the share sheet and tap <strong>Add to Home Screen</strong>.</li>
                    <li>Confirm the name shows <strong>${this.APP_NAME}</strong>, then tap <strong>Add</strong>.</li>
                    <li>Find the new icon on your Home Screen — tap it anytime to open your card and QR code.</li>
                </ol>
            </div>
            <div class="home-screen-guide__panel" role="tabpanel" data-platform="android" hidden>
                <ol class="home-screen-guide__steps">
                    <li>On your Android phone, open your <strong>My card</strong> link in <strong>Chrome</strong>.</li>
                    <li>Tap the <strong>⋮</strong> menu (three dots) in the top-right corner.</li>
                    <li>Tap <strong>Add to Home screen</strong> or <strong>Install app</strong>.</li>
                    <li>Confirm the name shows <strong>${this.APP_NAME}</strong>, then tap <strong>Add</strong> or <strong>Install</strong>.</li>
                    <li>Find the shortcut on your Home Screen or in your app drawer — tap it to open your card and QR code.</li>
                </ol>
            </div>
            <p class="home-screen-guide__update-note"><strong>Updating your card?</strong> Remove the old Home Screen shortcut first (long-press the icon → Remove App / Uninstall), then add it again so the icon and name refresh.</p>`;

        if (compact) {
            return `<details class="home-screen-guide home-screen-guide--compact">
                <summary class="home-screen-guide__summary">Add to Home Screen</summary>
                <div class="home-screen-guide__body">${inner}</div>
            </details>`;
        }

        return `<div class="home-screen-guide home-screen-guide--full">${inner}</div>`;
    },

    mount(container, options = {}) {
        if (!container) return;
        container.innerHTML = this.render(options);
        this.bindTabs(container);
    },

    bindTabs(container) {
        const tabs = container.querySelectorAll('.home-screen-guide__tab');
        const panels = container.querySelectorAll('.home-screen-guide__panel');
        if (!tabs.length) return;

        tabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                const platform = tab.dataset.platform;
                tabs.forEach((t) => {
                    const active = t === tab;
                    t.classList.toggle('is-active', active);
                    t.setAttribute('aria-selected', active ? 'true' : 'false');
                });
                panels.forEach((panel) => {
                    const active = panel.dataset.platform === platform;
                    panel.classList.toggle('is-active', active);
                    panel.hidden = !active;
                });
            });
        });
    },

    escapeHtml(str) {
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    },

    escapeAttr(str) {
        return this.escapeHtml(str);
    }
};
