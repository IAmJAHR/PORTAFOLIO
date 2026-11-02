// ==========================================
// 📊 CHAT STATE - Patrón: State & Observer (<80 líneas)
// ==========================================
(function() {
    class ChatState {
        constructor() {
            this.channel = 'general-ops';
            this.userAlias = localStorage.getItem('chat_alias') || '';
            this.passphrase = localStorage.getItem('chat_pass_' + this.channel) || 'senku-ops';
            this.isEphemeral = false;
            this.knownMessageIds = new Set();
            this.listeners = [];
            this.customRooms = JSON.parse(localStorage.getItem('chat_custom_rooms') || '[]');
        }

        subscribe(cb) { this.listeners.push(cb); }
        notify(event, data) { this.listeners.forEach(fn => fn(event, data)); }

        setChannel(chan, pass) {
            this.channel = chan;
            if (pass) {
                this.passphrase = pass;
                localStorage.setItem('chat_pass_' + chan, pass);
            } else {
                this.passphrase = localStorage.getItem('chat_pass_' + chan) || 'senku-ops';
            }
            this.knownMessageIds.clear();
            this.notify('channel_changed', { channel: this.channel, passphrase: this.passphrase });
        }

        setAlias(alias) {
            this.userAlias = String(alias).trim();
            localStorage.setItem('chat_alias', this.userAlias);
            this.notify('alias_changed', this.userAlias);
        }

        setPassphrase(pass) {
            this.passphrase = pass || 'senku-ops';
            localStorage.setItem('chat_pass_' + this.channel, this.passphrase);
            this.knownMessageIds.clear();
            this.notify('passphrase_changed', this.passphrase);
        }

        addPrivateRoom(roomName, pass) {
            const cleanName = roomName.toLowerCase().replace(/[^a-z0-9_-]/g, '').substring(0, 24);
            if (!this.customRooms.some(r => r.name === cleanName)) {
                this.customRooms.push({ name: cleanName, isPrivate: true });
                localStorage.setItem('chat_custom_rooms', JSON.stringify(this.customRooms));
            }
            this.setChannel(cleanName, pass);
            this.notify('room_created', cleanName);
        }

        toggleEphemeral() {
            this.isEphemeral = !this.isEphemeral;
            this.notify('ephemeral_toggled', this.isEphemeral);
            return this.isEphemeral;
        }
    }

    window.ChatState = ChatState;
})();
