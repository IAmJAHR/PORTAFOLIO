// ==========================================
// 🚀 CHAT MAIN - Patrón: Facade / Controller (<95 líneas)
// ==========================================
(function() {
    document.addEventListener('DOMContentLoaded', () => {
        const state = new window.ChatState();
        const ui = new window.ChatUI(state);
        const sidebar = document.querySelector('.chat-sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        const chanBadge = document.getElementById('active-channel-badge');

        const closeDrawer = () => {
            sidebar?.classList.remove('open');
            backdrop?.classList.remove('open');
        };
        const toggleDrawer = (e) => {
            if (e) e.stopPropagation();
            sidebar?.classList.toggle('open');
            backdrop?.classList.toggle('open');
        };

        document.getElementById('btn-toggle-sidebar')?.addEventListener('click', toggleDrawer);
        document.getElementById('btn-close-sidebar')?.addEventListener('click', closeDrawer);
        backdrop?.addEventListener('click', closeDrawer);

        const net = new window.ChatNetwork(state, (msgs, isMine) => {
            msgs.forEach(m => ui.appendMessage(m, isMine || m.sender === state.userAlias));
        });

        function refreshChannelUI() {
            const k = document.getElementById('chat-key-input');
            if (k) k.value = state.passphrase === 'senku-ops' ? '' : state.passphrase;
            if (chanBadge) chanBadge.textContent = '#' + state.channel;
            ui.clear();
            state.knownMessageIds.clear();
            net.fetchMessages();
        }

        async function syncRooms() {
            const list = document.getElementById('chat-channel-list');
            if (!list) return;
            const rooms = await net.fetchRooms();
            list.innerHTML = rooms.map(r => `
                <li class="channel-item ${state.channel === r.name ? 'active' : ''}" data-channel="${r.name}" data-priv="${r.is_private}">
                    <i class="fas ${r.is_private ? 'fa-lock' : 'fa-hashtag'}"></i>
                    <span class="channel-name">${r.name}</span>
                    ${r.is_private ? '<span class="room-priv-tag">PRIVADA</span>' : ''}
                </li>
            `).join('');

            list.querySelectorAll('.channel-item').forEach(btn => {
                btn.addEventListener('click', () => {
                    const chan = btn.dataset.channel;
                    const isPriv = btn.dataset.priv === 'true';
                    closeDrawer();
                    state.setChannel(chan);
                    refreshChannelUI();
                    syncRooms();
                    if (isPriv && !localStorage.getItem('chat_pass_' + chan)) {
                        window.openKeyModal?.(chan);
                    }
                });
            });
        }

        new window.ChatAuthModal(state, net, () => {
            const a = document.getElementById('chat-alias-input');
            if (a) a.value = state.userAlias;
            refreshChannelUI();
            syncRooms();
            setInterval(syncRooms, 8000);
            net.startPolling(2200);
        }, () => {
            refreshChannelUI();
            syncRooms();
        });

        new window.ChatTutorial();

        document.getElementById('chat-alias-input')?.addEventListener('change', (e) => {
            state.setAlias(e.target.value);
            window.CyberToast?.info(`Alias: ${state.userAlias}`);
        });

        document.getElementById('chat-key-input')?.addEventListener('change', (e) => {
            state.setPassphrase(e.target.value.trim() || 'senku-ops');
            refreshChannelUI();
            window.CyberToast?.success('Clave E2E actualizada.');
        });

        document.getElementById('btn-ephemeral')?.addEventListener('click', (e) => {
            const active = state.toggleEphemeral();
            e.currentTarget.classList.toggle('active', active);
            window.CyberToast?.[active ? 'warning' : 'info'](active ? 'Modo Efímero: 30s' : 'Modo Persistente');
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
                window.CyberToast?.error('Error al transmitir.');
            }
        });
    });
})();
