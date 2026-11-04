// ==========================================
// 🚀 CYBERPUNK HUD TOAST SYSTEM - Mobile & Desktop (<75 líneas)
// ==========================================
(function() {
    const ICONS = {
        success: '⚡',
        error: '⚠️',
        warning: '🔐',
        info: '📡'
    };

    let container = null;

    function getContainer() {
        if (!container || !document.body.contains(container)) {
            container = document.createElement('div');
            container.id = 'cyber-toast-container';
            const isMob = window.innerWidth <= 640;
            container.style.cssText = isMob
                ? 'position:fixed;top:66px;left:12px;right:12px;z-index:99999;display:flex;flex-direction:column;gap:8px;pointer-events:none;align-items:center;'
                : 'position:fixed;bottom:76px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:10px;pointer-events:none;align-items:flex-end;';
            document.body.appendChild(container);
        }
        return container;
    }

    function createToast(message, type = 'info', duration = 2800) {
        const cont = getContainer();
        const toast = document.createElement('div');
        const accent = type === 'success' ? '#00FF87' : type === 'error' ? '#FF0055' : type === 'warning' ? '#FFB800' : '#00D4FF';

        toast.style.cssText = `
            pointer-events:auto; width:fit-content; max-width:min(92vw, 380px);
            padding:10px 14px; border-radius:8px; font-family:'Orbitron', -apple-system, sans-serif;
            font-size:11px; letter-spacing:0.4px; color:#E2E8F0;
            background:rgba(8, 13, 26, 0.94); backdrop-filter:blur(14px);
            border:1px solid ${accent}; border-left:4px solid ${accent};
            box-shadow:0 8px 24px rgba(0,0,0,0.6), 0 0 12px ${accent}33;
            display:flex; align-items:center; gap:10px;
            transform:translateY(-10px); opacity:0;
            transition:transform 0.25s ease, opacity 0.25s ease;
        `;

        toast.innerHTML = `
            <span style="font-size:14px;line-height:1;">${ICONS[type] || '📡'}</span>
            <span style="flex:1;line-height:1.35;word-break:break-word;">${message}</span>
        `;

        cont.appendChild(toast);
        requestAnimationFrame(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';
        });

        setTimeout(() => {
            toast.style.transform = 'translateY(-10px)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 260);
        }, duration);
    }

    window.CyberToast = {
        show: (msg, type = 'info', d) => createToast(msg, type, d),
        success: (msg, d) => createToast(msg, 'success', d),
        error: (msg, d) => createToast(msg, 'error', d),
        warning: (msg, d) => createToast(msg, 'warning', d),
        info: (msg, d) => createToast(msg, 'info', d)
    };

    window.alert = (msg) => window.CyberToast.info(msg);
})();
