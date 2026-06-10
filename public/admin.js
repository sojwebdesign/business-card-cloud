let adminKey = '';
let nextCursor = null;

const authForm = document.getElementById('adminAuthForm');
const statusEl = document.getElementById('adminStatus');
const tableWrap = document.getElementById('adminTableWrap');
const tableBody = document.getElementById('adminTableBody');
const loadMoreBtn = document.getElementById('loadMoreCardsBtn');

authForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    adminKey = document.getElementById('adminKey')?.value?.trim() || '';
    tableBody.innerHTML = '';
    nextCursor = null;
    await loadCards(false);
});

loadMoreBtn?.addEventListener('click', () => loadCards(true));

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
                limit: 50
            })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not load cards');

        if (!append) tableBody.innerHTML = '';
        result.cards.forEach((card) => tableBody.appendChild(renderRow(card)));

        nextCursor = result.cursor || null;
        tableWrap?.classList.remove('hidden');
        loadMoreBtn?.classList.toggle('hidden', !nextCursor);
        setStatus(`${tableBody.children.length} card${tableBody.children.length === 1 ? '' : 's'} loaded`);
    } catch (error) {
        setStatus(error.message || 'Could not load cards', true);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Load cards';
        }
    }
}

function renderRow(card) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${escapeHtml(card.fullName)}<div class="admin-row-meta">${escapeHtml(card.jobTitle)}</div></td>
        <td>${escapeHtml(card.email || '—')}</td>
        <td><code>${escapeHtml(card.slug)}</code></td>
        <td>${escapeHtml(formatDate(card.updatedAt))}</td>
        <td class="admin-actions"><button type="button" class="btn btn-secondary btn-danger btn-sm">Delete</button></td>`;

    row.querySelector('button')?.addEventListener('click', async () => {
        if (!confirm(`Delete ${card.fullName} (${card.slug})? This cannot be undone.`)) return;
        const btn = row.querySelector('button');
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
            setStatus(`${tableBody.children.length} card${tableBody.children.length === 1 ? '' : 's'} loaded`);
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
