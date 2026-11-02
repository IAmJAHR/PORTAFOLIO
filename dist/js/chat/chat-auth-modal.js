// ==========================================
// 🛡️ CHAT AUTH & ROOM MODALS - Patrón: Modal Controller (<85 líneas)
// ==========================================
(function() {
    class ChatAuthModal {
        constructor(state, network, onReady) {
            this.state = state;
            this.network = network;
            this.onReady = onReady;
            this.initUserGate();
            this.initCreateRoomModal();
        }

        initUserGate() {
            const gate = document.getElementById('modal-user-gate');
            const input = document.getElementById('gate-alias-input');
            const btn = document.getElementById('gate-submit-btn');
            if (!this.state.userAlias) {
                gate.classList.remove('hidden');
                btn.addEventListener('click', () => {
                    const alias = input.value.trim();
                    if (!alias) { window.CyberToast?.warning('Ingresa tu alias de operador.'); return; }
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

        initCreateRoomModal() {
            const modal = document.getElementById('modal-private-room');
            const openBtn = document.getElementById('btn-open-private-room');
            const closeBtn = document.getElementById('btn-close-private-room');
            const form = document.getElementById('form-private-room');
            const nameInput = document.getElementById('private-room-name');
            const passInput = document.getElementById('private-room-pass');
            const isPrivInput = document.getElementById('private-room-is-priv');

            if (openBtn) openBtn.addEventListener('click', () => modal.classList.remove('hidden'));
            if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const name = nameInput.value.trim();
                    const pass = passInput.value.trim();
                    const isPriv = isPrivInput ? isPrivInput.checked : true;
                    if (!name) { window.CyberToast?.warning('Ingresa un nombre para la sala.'); return; }
                    if (isPriv && !pass) { window.CyberToast?.warning('Ingresa la contraseña de la sala privada.'); return; }

                    try {
                        await this.network.createRoom(name, name, isPriv);
                        this.state.setChannel(name, pass || 'senku-ops');
                        modal.classList.add('hidden');
                        nameInput.value = ''; passInput.value = '';
                        window.CyberToast?.success(`Sala #${name} creada en el servidor y conectada.`);
                    } catch (err) {
                        window.CyberToast?.error('Error al registrar la sala.');
                    }
                });
            }
        }
    }

    window.ChatAuthModal = ChatAuthModal;
})();
