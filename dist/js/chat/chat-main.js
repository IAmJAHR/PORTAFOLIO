// ==========================================
// 🚀 CHAT MAIN - Patrón: Facade / Controller (<85 líneas)
// ==========================================
(function() {
    document.addEventListener('DOMContentLoaded', () => {
        const state = new window.ChatState();
        const ui = new window.ChatUI(state);
        const net = new window.ChatNetwork(state, (msgs, isMine) => {
            msgs.forEach(m => ui.appendMessage(m, isMine || m.sender === state.userAlias));
        });

        // Binding de Canales
        document.querySelectorAll('.channel-item').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.channel-item').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const chan = btn.dataset.channel;
                ui.clear();
                state.setChannel(chan);
                net.fetchMessages();
                window.CyberToast?.info(`Conectado al canal #${chan}`);
            });
        });

        // Configuración de Alias y Clave E2E
        const aliasInput = document.getElementById('chat-alias-input');
        if (aliasInput) {
            aliasInput.value = state.userAlias;
            aliasInput.addEventListener('change', () => state.setAlias(aliasInput.value));
        }

        const keyInput = document.getElementById('chat-key-input');
        if (keyInput) {
            keyInput.value = state.passphrase;
            keyInput.addEventListener('change', () => {
                state.setPassphrase(keyInput.value);
                ui.clear();
                state.knownMessageIds.clear();
                net.fetchMessages();
                window.CyberToast?.success('Llave de descifrado actualizada.');
            });
        }

        // Toggle Efímero
        const ephemBtn = document.getElementById('btn-ephemeral');
        if (ephemBtn) {
            ephemBtn.addEventListener('click', () => {
                const active = state.toggleEphemeral();
                ephemBtn.classList.toggle('active', active);
                window.CyberToast?.[active ? 'warning' : 'info'](
                    active ? '🔥 Modo Efímero Activo (Auto-destrucción 30s)' : '🔒 Modo Almacenamiento Estándar'
                );
            });
        }

        // Envío de Mensajes Cifrados
        const form = document.getElementById('chat-form');
        const textInput = document.getElementById('chat-text-input');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = textInput.value.trim();
            if (!text) return;

            try {
                const { ciphertext, iv } = await window.ChatCrypto.encrypt(text, state.passphrase);
                textInput.value = '';
                await net.sendMessage(ciphertext, iv);
            } catch (err) {
                window.CyberToast?.error('Error al transmitir el mensaje.');
            }
        });

        net.startPolling(2500);
    });
})();
