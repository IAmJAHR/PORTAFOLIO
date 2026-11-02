// ==========================================
// 📡 CHAT NETWORK - Patrón: Service / Network (<90 líneas)
// ==========================================
(function() {
    class ChatNetwork {
        constructor(state, onNewMessages) {
            this.state = state;
            this.onNewMessages = onNewMessages;
            this.pollTimer = null;
        }

        async fetchRooms() {
            try {
                const res = await fetch(`/api/chat/rooms?_t=${Date.now()}`);
                if (!res.ok) return [];
                const data = await res.json();
                return data.rooms || [];
            } catch (e) {
                return [];
            }
        }

        async createRoom(name, title, isPrivate) {
            const res = await fetch('/api/chat/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, title, is_private: isPrivate, sender: this.state.userAlias })
            });
            if (!res.ok) throw new Error('Error al registrar sala');
            const data = await res.json();
            return data.room;
        }

        async fetchMessages() {
            try {
                const res = await fetch(`/api/chat/messages?channel=${this.state.channel}&_t=${Date.now()}`);
                if (!res.ok) return;
                const data = await res.json();
                const list = data.messages || [];
                const brandNew = list.filter(m => !this.state.knownMessageIds.has(m.id));
                brandNew.forEach(m => this.state.knownMessageIds.add(m.id));
                if (brandNew.length > 0) this.onNewMessages(brandNew, false);
            } catch (err) {}
        }

        async sendMessage(ciphertext, iv) {
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
                throw new Error(errData.error || `Error ${res.status}`);
            }
            const data = await res.json();
            if (data.message) {
                this.state.knownMessageIds.add(data.message.id);
                this.onNewMessages([data.message], true);
            }
            return true;
        }

        startPolling(intervalMs = 2500) {
            this.fetchMessages();
            clearInterval(this.pollTimer);
            this.pollTimer = setInterval(() => this.fetchMessages(), intervalMs);
        }
    }

    window.ChatNetwork = ChatNetwork;
})();
