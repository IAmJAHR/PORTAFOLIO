// ==========================================
// 🛡️ CHAT AUTH & ROOM MODALS - Patrón: Modal Controller (<95 líneas)
// ==========================================
(function() {
    class ChatAuthModal {
        constructor(state, network, onReady, onKeyUpdated) {
            this.state = state;
            this.network = network;
            this.onReady = onReady;
            this.onKeyUpdated = onKeyUpdated;
            this.initUserGate();
            this.initCreateRoomModal();
            this.initRoomKeyModal();
        }

        initUserGate() {
            const gate = document.getElementById('modal-user-gate');
            const form = document.getElementById('gate-form');
            const input = document.getElementById('gate-alias-input');
            if (!this.state.userAlias) {
                gate.classList.remove('hidden');
                const submitAlias = (e) => {
                    if (e) e.preventDefault();
                    const alias = input.value.trim();
                    if (!alias) { window.CyberToast?.warning('Ingresa tu alias de operador.'); return; }
                    this.state.setAlias(alias);
                    gate.classList.add('hidden');
                    window.CyberToast?.success(`Operador activo: ${alias}`);
                    if (this.onReady) this.onReady();
                };
                if (form) form.addEventListener('submit', submitAlias);
                else document.getElementById('gate-submit-btn')?.addEventListener('click', submitAlias);
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

            if (isPrivInput && passInput) {
                isPrivInput.addEventListener('change', () => {
                    passInput.style.display = isPrivInput.checked ? 'block' : 'none';
                });
            }
            if (openBtn) openBtn.addEventListener('click', () => modal.classList.remove('hidden'));
            if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

            form?.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = nameInput.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
                const pass = passInput.value.trim();
                const isPriv = isPrivInput ? isPrivInput.checked : true;
                if (!name) { window.CyberToast?.warning('Ingresa un nombre válido para la sala.'); return; }
                if (isPriv && !pass) { window.CyberToast?.warning('Define una clave para la sala privada.'); return; }

                try {
                    await this.network.createRoom(name, name, isPriv);
                    this.state.setChannel(name, isPriv ? pass : 'senku-ops');
                    modal.classList.add('hidden');
                    nameInput.value = ''; passInput.value = '';
                    if (this.onKeyUpdated) this.onKeyUpdated();
                    window.CyberToast?.success(`Sala #${name} activa.`);
                } catch (err) {
                    window.CyberToast?.error('No se pudo crear la sala.');
                }
            });
        }

        initRoomKeyModal() {
            const modal = document.getElementById('modal-room-key');
            if (!modal) return;
            const form = document.getElementById('form-room-key');
            const input = document.getElementById('room-key-modal-input');
            const closeBtn = document.getElementById('btn-close-room-key');
            const titleSpan = document.getElementById('room-key-modal-channel');

            window.openKeyModal = (chanName) => {
                const targetChan = chanName || this.state.channel;
                if (titleSpan) titleSpan.textContent = '#' + targetChan;
                const saved = localStorage.getItem('chat_pass_' + targetChan) || '';
                if (input) input.value = saved === 'senku-ops' ? '' : saved;
                modal.classList.remove('hidden');
                setTimeout(() => input?.focus(), 80);
            };

            document.getElementById('btn-nav-key')?.addEventListener('click', () => window.openKeyModal());
            closeBtn?.addEventListener('click', () => modal.classList.add('hidden'));

            form?.addEventListener('submit', (e) => {
                e.preventDefault();
                const newPass = input.value.trim() || 'senku-ops';
                this.state.setPassphrase(newPass);
                modal.classList.add('hidden');
                if (this.onKeyUpdated) this.onKeyUpdated();
                window.CyberToast?.success(`Clave aplicada en #${this.state.channel}`);
            });
        }
    }

    window.ChatAuthModal = ChatAuthModal;
})();
