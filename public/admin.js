let adminKey = '';
let nextCursor = null;
let templateFilter = '';
let searchQuery = '';
let searchDebounceTimer = null;

const authForm = document.getElementById('adminAuthForm');
const statusEl = document.getElementById('adminStatus');
const tableWrap = document.getElementById('adminTableWrap');
const tableBody = document.getElementById('adminTableBody');
const loadMoreBtn = document.getElementById('loadMoreCardsBtn');
const templateFilterEl = document.getElementById('adminTemplateFilter');
const searchInputEl = document.getElementById('adminSearch');

authForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    adminKey = document.getElementById('adminKey')?.value?.trim() || '';
    tableBody.innerHTML = '';
    nextCursor = null;
    await loadCards(false);
});

loadMoreBtn?.addEventListener('click', () => loadCards(true));

templateFilterEl?.addEventListener('change', async () => {
    templateFilter = templateFilterEl.value || '';
    if (!adminKey) return;
    await reloadCards();
});

searchInputEl?.addEventListener('input', () => {
    searchQuery = searchInputEl.value.trim();
    if (!adminKey) return;
    window.clearTimeout(searchDebounceTimer);
    searchDebounceTimer = window.setTimeout(() => {
        reloadCards();
    }, 350);
});

searchInputEl?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    searchQuery = searchInputEl.value.trim();
    if (!adminKey) return;
    window.clearTimeout(searchDebounceTimer);
    reloadCards();
});

async function reloadCards() {
    tableBody.innerHTML = '';
    nextCursor = null;
    await loadCards(false);
}

async function loadCards(append) {
    const btn = document.getElementById('loadCardsBtn');
    if (!adminKey) return;

    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Loading…';
    }
    setStatus('Loading cards…');

    try {
        const response = await fetch('/business-card/api/admin/cards/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                adminKey,
                cursor: append ? nextCursor : undefined,
                limit: 50,
                templateId: templateFilter || undefined,
                search: searchQuery || undefined
            })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not load cards');

        if (!append) tableBody.innerHTML = '';
        result.cards.forEach((card) => tableBody.appendChild(renderRow(card)));

        nextCursor = result.cursor || null;
        tableWrap?.classList.remove('hidden');
        loadMoreBtn?.classList.toggle('hidden', !nextCursor);
        setStatus(statusMessage(tableBody.children.length, templateFilter, searchQuery));
    } catch (error) {
        setStatus(error.message || 'Could not load cards', true);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Load cards';
        }
    }
}

function statusMessage(count, filter, search) {
    const noun = `${count} card${count === 1 ? '' : 's'} loaded`;
    const parts = [noun];

    if (search) parts.push(`matching “${search}”`);
    if (filter === 'sojern') parts.push('Sojern Branded');
    if (filter === 'rategain') parts.push('RateGain Branded');

    return parts.join(' · ');
}

function templateBadgeHtml(card) {
    const id = card.templateId || 'sojern';
    const label = escapeHtml(card.templateLabel || 'Sojern Branded');
    return `<span class="card-template-badge card-template-badge--${id}">${label}</span>`;
}

function renderRow(card) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${escapeHtml(card.fullName)}<div class="admin-row-meta">${escapeHtml(card.jobTitle)}</div></td>
        <td>${escapeHtml(card.email || '—')}</td>
        <td>${templateBadgeHtml(card)}</td>
        <td><code>${escapeHtml(card.slug)}</code></td>
        <td>${escapeHtml(formatDate(card.updatedAt))}</td>
        <td class="admin-actions">
            <button type="button" class="btn btn-secondary btn-sm" data-action="send-edit">Send edit link</button>
            <button type="button" class="btn btn-secondary btn-danger btn-sm" data-action="delete">Delete</button>
        </td>`;

    row.querySelector('[data-action="send-edit"]')?.addEventListener('click', async (event) => {
        const btn = event.currentTarget;
        const email = card.email || 'the address on this card';
        if (!confirm(`Send a one-time edit link to ${card.fullName} at ${email}?`)) return;

        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Sending…';

        try {
            const response = await fetch('/business-card/api/admin/cards/send-edit-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminKey, slug: card.slug })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Could not send edit link');
            showToast(result.message || 'Edit link sent', 'success');
        } catch (error) {
            showToast(error.message || 'Could not send edit link', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    });

    row.querySelector('[data-action="delete"]')?.addEventListener('click', async (event) => {
        const btn = event.currentTarget;
        if (!confirm(`Delete ${card.fullName} (${card.slug})? This cannot be undone.`)) return;

        btn.disabled = true;
        btn.textContent = 'Deleting…';

        try {
            const response = await fetch('/business-card/api/admin/cards/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminKey, slug: card.slug })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Delete failed');
            row.remove();
            showToast('Card deleted', 'success');
            setStatus(statusMessage(tableBody.children.length, templateFilter, searchQuery));
        } catch (error) {
            showToast(error.message || 'Could not delete card', 'error');
            btn.disabled = false;
            btn.textContent = 'Delete';
        }
    });

    return row;
}

function setStatus(message, isError = false) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.remove('hidden', 'admin-status--error');
    if (isError) statusEl.classList.add('admin-status--error');
}

function formatDate(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function escapeHtml(str) {
    return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
