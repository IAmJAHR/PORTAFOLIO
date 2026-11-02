// ==========================================
// 🚀 CHAT MAIN - Patrón: Facade / Controller (<90 líneas)
// ==========================================
(function() {
    document.addEventListener('DOMContentLoaded', () => {
        const state = new window.ChatState();
        const ui = new window.ChatUI(state);
        const net = new window.ChatNetwork(state, (msgs, isMine) => {
            msgs.forEach(m => ui.appendMessage(m, isMine || m.sender === state.userAlias));
        });

        function renderChannels() {
            const list = document.getElementById('chat-channel-list');
            if (!list) return;
            const defs = [
                { id: 'general-ops', label: 'general-ops', icon: 'fa-hashtag' },
                { id: 'cryptography-lab', label: 'crypto-lab', icon: 'fa-key' },
                { id: 'enterprise-sap', label: 'enterprise-sap', icon: 'fa-network-wired' }
            ];
            const all = [...defs, ...state.customRooms.map(r => ({ id: r.name, label: r.name + ' (privada)', icon: 'fa-shield-halved' }))];
            list.innerHTML = all.map(c => `
                <li class="channel-item ${state.channel === c.id ? 'active' : ''}" data-channel="${c.id}">
                    <i class="fas ${c.icon}"></i> ${c.label}
                </li>
            `).join('');

            list.querySelectorAll('.channel-item').forEach(btn => {
                btn.addEventListener('click', () => {
                    list.querySelectorAll('.channel-item').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    ui.clear();
                    state.setChannel(btn.dataset.channel);
                    const k = document.getElementById('chat-key-input');
                    if (k) k.value = state.passphrase;
                    net.fetchMessages();
                    window.CyberToast?.info(`Conectado a #${btn.dataset.channel}`);
                });
            });
        }

        renderChannels();
        state.subscribe((evt) => { if (evt === 'room_created') renderChannels(); });

        new window.ChatAuthModal(state, () => {
            const a = document.getElementById('chat-alias-input'); if (a) a.value = state.userAlias;
            const k = document.getElementById('chat-key-input'); if (k) k.value = state.passphrase;
            net.startPolling(2500);
        });

        new window.ChatTutorial();

        document.getElementById('chat-alias-input')?.addEventListener('change', (e) => state.setAlias(e.target.value));
        document.getElementById('chat-key-input')?.addEventListener('change', (e) => {
            state.setPassphrase(e.target.value); ui.clear(); net.fetchMessages();
            window.CyberToast?.success('Clave E2E actualizada.');
        });

        document.getElementById('btn-ephemeral')?.addEventListener('click', (e) => {
            const active = state.toggleEphemeral();
            e.currentTarget.classList.toggle('active', active);
            window.CyberToast?.[active ? 'warning' : 'info'](active ? '🔥 Modo Efímero Activo (30s)' : '🔒 Modo Almacenamiento Estándar');
        });

        document.getElementById('chat-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = document.getElementById('chat-text-input');
            const txt = input.value.trim();
            if (!txt) return;
            try {
                const { ciphertext, iv } = await window.ChatCrypto.encrypt(txt, state.passphrase);
                input.value = '';
                await net.sendMessage(ciphertext, iv);
            } catch (err) {
                window.CyberToast?.error(err.message || 'Error al transmitir.');
            }
        });
    });
})();
