// ==========================================
// 🚀 CHAT MAIN - Patrón: Facade / Controller (<90 líneas)
// ==========================================
(function() {
    document.addEventListener('DOMContentLoaded', () => {
        const state = new window.ChatState();
        const ui = new window.ChatUI(state);
        const sidebar = document.querySelector('.chat-sidebar');
        const net = new window.ChatNetwork(state, (msgs, isMine) => {
            msgs.forEach(m => ui.appendMessage(m, isMine || m.sender === state.userAlias));
        });

        document.getElementById('btn-toggle-sidebar')?.addEventListener('click', (e) => {
            e.stopPropagation(); sidebar?.classList.toggle('open');
        });
        document.querySelector('.chat-viewport')?.addEventListener('click', () => sidebar?.classList.remove('open'));

        async function syncRooms() {
            const list = document.getElementById('chat-channel-list');
            if (!list) return;
            const rooms = await net.fetchRooms();
            list.innerHTML = rooms.map(r => `
                <li class="channel-item ${state.channel === r.name ? 'active' : ''}" data-channel="${r.name}" data-priv="${r.is_private}">
                    <i class="fas ${r.is_private ? 'fa-lock' : 'fa-hashtag'}"></i> ${r.name} ${r.is_private ? '<span style="font-size:9px;color:var(--purple);">[PRIVADA]</span>' : ''}
                </li>
            `).join('');

            list.querySelectorAll('.channel-item').forEach(btn => {
                btn.addEventListener('click', () => {
                    const chan = btn.dataset.channel;
                    const isPriv = btn.dataset.priv === 'true';
                    list.querySelectorAll('.channel-item').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    sidebar?.classList.remove('open');

                    if (isPriv && !localStorage.getItem('chat_pass_' + chan)) {
                        window.CyberToast?.warning(`Sala privada: ingresa la clave E2E abajo`);
                    }
                    ui.clear();
                    state.setChannel(chan);
                    const k = document.getElementById('chat-key-input');
                    if (k) k.value = state.passphrase;
                    net.fetchMessages();
                    window.CyberToast?.info(`Conectado a #${chan}`);
                });
            });
        }

        new window.ChatAuthModal(state, net, () => {
            const a = document.getElementById('chat-alias-input'); if (a) a.value = state.userAlias;
            const k = document.getElementById('chat-key-input'); if (k) k.value = state.passphrase;
            syncRooms();
            setInterval(syncRooms, 8000);
            net.startPolling(2500);
        });

        new window.ChatTutorial();
        state.subscribe((evt) => { if (evt === 'channel_changed') syncRooms(); });

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
