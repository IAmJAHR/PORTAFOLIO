// ==========================================
// 🚀 CYBERPUNK ARCADE TOAST NOTIFICATION SYSTEM
// Patrón: Singleton / Factory - Cero dependencias (No SWAL, No Alert)
// ==========================================
(function() {
    const ICONS = {
        success: '🔥',
        error: '⚠️',
        warning: '⚡',
        info: '👾'
    };

    let container = null;

    function getContainer() {
        if (!container || !document.body.contains(container)) {
            container = document.createElement('div');
            container.id = 'cyber-toast-container';
            container.style.cssText = `
                position: fixed; top: 20px; right: 20px; z-index: 99999;
                display: flex; flex-direction: column; gap: 12px; pointer-events: none;
            `;
            document.body.appendChild(container);
        }
        return container;
    }

    function createToast(message, type = 'info', duration = 3500) {
        const cont = getContainer();
        const toast = document.createElement('div');
        toast.className = `cyber-toast cyber-toast-${type}`;
        toast.style.cssText = `
            pointer-events: auto; min-width: 280px; max-width: 420px;
            padding: 14px 20px; border-radius: 10px; font-family: 'Orbitron', monospace;
            font-size: 13px; color: #fff; background: rgba(10, 15, 30, 0.95);
            backdrop-filter: blur(12px); border-left: 5px solid ${type === 'success' ? '#00FF87' : type === 'error' ? '#FF0055' : type === 'warning' ? '#FFD93D' : '#00D4FF'};
            box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 15px ${type === 'success' ? 'rgba(0,255,135,0.3)' : type === 'error' ? 'rgba(255,0,85,0.3)' : 'rgba(0,212,255,0.3)'};
            display: flex; align-items: center; gap: 12px; transform: translateX(120%);
            transition: transform 0.35s cubic-bezier(0.18, 0.89, 0.32, 1.28), opacity 0.3s ease;
            opacity: 0;
        `;

        toast.innerHTML = `
            <span style="font-size: 20px; filter: drop-shadow(0 0 5px currentColor);">${ICONS[type] || '⚡'}</span>
            <span style="flex: 1; line-height: 1.4; word-break: break-word;">${message}</span>
            <button style="background: none; border: none; color: #8892b0; font-size: 16px; cursor: pointer; padding: 0 4px;" onclick="this.parentElement.remove()">✕</button>
        `;

        cont.appendChild(toast);
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        });

        setTimeout(() => {
            toast.style.transform = 'translateX(120%)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 400);
        }, duration);
    }

    window.CyberToast = {
        show: (msg, type = 'info', d) => createToast(msg, type, d),
        success: (msg, d) => createToast(msg, 'success', d),
        error: (msg, d) => createToast(msg, 'error', d),
        warning: (msg, d) => createToast(msg, 'warning', d),
        info: (msg, d) => createToast(msg, 'info', d)
    };

    // Reemplazo transparente del alert nativo
    window.alert = function(msg) {
        window.CyberToast.info(msg);
    };
})();
