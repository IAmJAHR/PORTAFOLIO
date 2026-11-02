// ==========================================
// 📡 CHAT NETWORK - Patrón: Service / Network (<80 líneas)
// ==========================================
(function() {
    class ChatNetwork {
        constructor(state, onNewMessages) {
            this.state = state;
            this.onNewMessages = onNewMessages;
            this.pollTimer = null;
        }

        async fetchMessages() {
            try {
                const res = await fetch(`/api/chat/messages?channel=${this.state.channel}&_t=${Date.now()}`);
                if (!res.ok) throw new Error('HTTP error ' + res.status);
                const data = await res.json();
                const list = data.messages || [];

                const brandNew = list.filter(m => !this.state.knownMessageIds.has(m.id));
                brandNew.forEach(m => this.state.knownMessageIds.add(m.id));

                if (brandNew.length > 0) {
                    this.onNewMessages(brandNew, false);
                }
            } catch (err) {
                console.warn('Sync en espera de red:', err.message);
            }
        }

        async sendMessage(ciphertext, iv) {
            try {
                const res = await fetch('/api/chat/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        channel: this.state.channel,
                        sender: this.state.userAlias,
                        ciphertext,
                        iv,
                        isEphemeral: this.state.isEphemeral
                    })
                });
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || `Servidor error ${res.status}`);
                }
                const data = await res.json();
                if (data.message) {
                    this.state.knownMessageIds.add(data.message.id);
                    this.onNewMessages([data.message], true);
                }
                return true;
            } catch (err) {
                console.error('Fallo de transmisión:', err);
                throw err;
            }
        }

        startPolling(intervalMs = 2500) {
            this.fetchMessages();
            clearInterval(this.pollTimer);
            this.pollTimer = setInterval(() => this.fetchMessages(), intervalMs);
        }

        stopPolling() {
            clearInterval(this.pollTimer);
        }
    }

    window.ChatNetwork = ChatNetwork;
})();
