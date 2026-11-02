// ==========================================
// 🛡️ CHAT AUTH & ROOM MODALS - Patrón: Modal Controller (<85 líneas)
// ==========================================
(function() {
    class ChatAuthModal {
        constructor(state, onReady) {
            this.state = state;
            this.onReady = onReady;
            this.initUserGate();
            this.initPrivateRoomModal();
        }

        initUserGate() {
            const gate = document.getElementById('modal-user-gate');
            const input = document.getElementById('gate-alias-input');
            const btn = document.getElementById('gate-submit-btn');

            if (!this.state.userAlias) {
                gate.classList.remove('hidden');
                btn.addEventListener('click', () => {
                    const alias = input.value.trim();
                    if (!alias) {
                        window.CyberToast?.warning('Por favor ingresa tu alias de operador.');
                        return;
                    }
                    this.state.setAlias(alias);
                    gate.classList.add('hidden');
                    window.CyberToast?.success(`Identidad verificada: ${alias}`);
                    if (this.onReady) this.onReady();
                });
            } else {
                gate.classList.add('hidden');
                if (this.onReady) this.onReady();
            }
        }

        initPrivateRoomModal() {
            const modal = document.getElementById('modal-private-room');
            const openBtn = document.getElementById('btn-open-private-room');
            const closeBtn = document.getElementById('btn-close-private-room');
            const form = document.getElementById('form-private-room');
            const nameInput = document.getElementById('private-room-name');
            const passInput = document.getElementById('private-room-pass');

            if (openBtn) openBtn.addEventListener('click', () => modal.classList.remove('hidden'));
            if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const name = nameInput.value.trim();
                    const pass = passInput.value.trim();
                    if (!name || !pass) {
                        window.CyberToast?.warning('Completa el nombre y la contraseña de la sala.');
                        return;
                    }
                    this.state.addPrivateRoom(name, pass);
                    modal.classList.add('hidden');
                    nameInput.value = ''; passInput.value = '';
                    window.CyberToast?.success(`Sala privada #${name} inicializada con cifrado E2E.`);
                });
            }
        }
    }

    window.ChatAuthModal = ChatAuthModal;
})();
