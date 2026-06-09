/**
 * Circular headshot crop — zoom and pan before applying to card.
 */
window.PhotoCrop = (function () {
    const OUTPUT_SIZE = 400;
    const VIEWPORT_SIZE = 280;

    let modal, canvas, ctx, zoomInput, zoomValueEl;
    let onApplyCallback = null;
    let image = null;
    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    let dragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragOriginX = 0;
    let dragOriginY = 0;

    function init() {
        modal = document.getElementById('photoCropModal');
        canvas = document.getElementById('photoCropCanvas');
        if (!modal || !canvas) return;
        ctx = canvas.getContext('2d');
        zoomInput = document.getElementById('photoCropZoom');
        zoomValueEl = document.getElementById('photoCropZoomValue');

        document.getElementById('photoCropCancel')?.addEventListener('click', close);
        document.getElementById('photoCropApply')?.addEventListener('click', apply);
        document.getElementById('photoCropClose')?.addEventListener('click', close);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) close();
        });

        zoomInput?.addEventListener('input', () => {
            scale = Number(zoomInput.value) / 100;
            if (zoomValueEl) zoomValueEl.textContent = `${zoomInput.value}%`;
            draw();
        });

        canvas.addEventListener('mousedown', startDrag);
        window.addEventListener('mousemove', moveDrag);
        window.addEventListener('mouseup', endDrag);

        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            e.preventDefault();
            startDrag(e.touches[0]);
        }, { passive: false });
        canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length !== 1) return;
            e.preventDefault();
            moveDrag(e.touches[0]);
        }, { passive: false });
        canvas.addEventListener('touchend', endDrag);
    }

    function open(sourceDataUrl, callback, existingCrop) {
        if (!modal) return;
        onApplyCallback = callback;
        const img = new Image();
        img.onload = () => {
            image = img;
            const minScale = getMinScale(img);
            scale = existingCrop?.scale ?? Math.max(minScale, 1);
            offsetX = existingCrop?.offsetX ?? 0;
            offsetY = existingCrop?.offsetY ?? 0;
            if (zoomInput) {
                zoomInput.min = Math.round(minScale * 100);
                zoomInput.max = '300';
                zoomInput.value = Math.round(scale * 100);
            }
            if (zoomValueEl) zoomValueEl.textContent = `${Math.round(scale * 100)}%`;
            draw();
            modal.classList.remove('hidden');
        };
        img.src = sourceDataUrl;
    }

    function close() {
        modal?.classList.add('hidden');
        image = null;
        onApplyCallback = null;
    }

    function getMinScale(img) {
        const r = VIEWPORT_SIZE / 2;
        return Math.max(r * 2 / img.width, r * 2 / img.height);
    }

    function getDrawMetrics() {
        const w = image.width * scale;
        const h = image.height * scale;
        const cx = VIEWPORT_SIZE / 2 + offsetX;
        const cy = VIEWPORT_SIZE / 2 + offsetY;
        return { w, h, x: cx - w / 2, y: cy - h / 2 };
    }

    function draw() {
        if (!ctx || !image) return;
        ctx.clearRect(0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE);
        ctx.fillStyle = '#e9ecef';
        ctx.fillRect(0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE);

        const { w, h, x, y } = getDrawMetrics();
        ctx.save();
        ctx.beginPath();
        ctx.arc(VIEWPORT_SIZE / 2, VIEWPORT_SIZE / 2, VIEWPORT_SIZE / 2 - 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(image, x, y, w, h);
        ctx.restore();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(VIEWPORT_SIZE / 2, VIEWPORT_SIZE / 2, VIEWPORT_SIZE / 2 - 2, 0, Math.PI * 2);
        ctx.stroke();
    }

    function startDrag(e) {
        if (!image) return;
        dragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        dragOriginX = offsetX;
        dragOriginY = offsetY;
        canvas.style.cursor = 'grabbing';
    }

    function moveDrag(e) {
        if (!dragging) return;
        offsetX = dragOriginX + (e.clientX - dragStartX);
        offsetY = dragOriginY + (e.clientY - dragStartY);
        draw();
    }

    function endDrag() {
        dragging = false;
        if (canvas) canvas.style.cursor = 'grab';
    }

    function apply() {
        if (!image || !onApplyCallback) return;
        const out = document.createElement('canvas');
        out.width = OUTPUT_SIZE;
        out.height = OUTPUT_SIZE;
        const octx = out.getContext('2d');
        const ratio = OUTPUT_SIZE / VIEWPORT_SIZE;
        const { w, h, x, y } = getDrawMetrics();

        octx.beginPath();
        octx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
        octx.clip();
        octx.drawImage(image, x * ratio, y * ratio, w * ratio, h * ratio);

        onApplyCallback({
            dataUrl: out.toDataURL('image/jpeg', 0.92),
            crop: { scale, offsetX, offsetY }
        });
        close();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return { open };
})();
