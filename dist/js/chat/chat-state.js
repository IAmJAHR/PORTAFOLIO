// ==========================================
// 📊 CHAT STATE - Patrón: State & Observer (<65 líneas)
// ==========================================
(function() {
    class ChatState {
        constructor() {
            this.channel = 'general-ops';
            this.userAlias = localStorage.getItem('chat_alias') || 'Operative_' + Math.floor(Math.random() * 899 + 100);
            this.passphrase = 'senku-protocol-2026';
            this.isEphemeral = false;
            this.knownMessageIds = new Set();
            this.listeners = [];
        }

        subscribe(cb) {
            this.listeners.push(cb);
        }

        notify(event, data) {
            this.listeners.forEach(fn => fn(event, data));
        }

        setChannel(newChannel) {
            if (this.channel === newChannel) return;
            this.channel = newChannel;
            this.knownMessageIds.clear();
            this.notify('channel_changed', this.channel);
        }

        setAlias(newAlias) {
            this.userAlias = String(newAlias).trim() || 'Operative';
            localStorage.setItem('chat_alias', this.userAlias);
            this.notify('alias_changed', this.userAlias);
        }

        setPassphrase(phrase) {
            this.passphrase = phrase || 'senku-protocol-2026';
            this.notify('passphrase_changed', this.passphrase);
        }

        toggleEphemeral() {
            this.isEphemeral = !this.isEphemeral;
            this.notify('ephemeral_toggled', this.isEphemeral);
            return this.isEphemeral;
        }
    }

    window.ChatState = ChatState;
})();
