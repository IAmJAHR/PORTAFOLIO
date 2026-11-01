// ==========================================
// 🎨 CHAT UI - Patrón: View / Component (<95 líneas)
// ==========================================
(function() {
    class ChatUI {
        constructor(state) {
            this.state = state;
            this.container = document.getElementById('chat-messages');
            this.audioCtx = null;
        }

        playChime(isSent = false) {
            try {
                if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = isSent ? 'sine' : 'triangle';
                osc.frequency.setValueAtTime(isSent ? 880 : 587, this.audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(isSent ? 1320 : 880, this.audioCtx.currentTime + 0.12);
                gain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
                gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.12);
                osc.connect(gain); gain.connect(this.audioCtx.destination);
                osc.start(); osc.stop(this.audioCtx.currentTime + 0.13);
            } catch (e) {}
        }

        async appendMessage(msg, isMine = false) {
            if (!this.container) return;
            const plain = await window.ChatCrypto.decrypt(msg.ciphertext, msg.iv, this.state.passphrase);
            const timeStr = new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const row = document.createElement('div');
            row.className = `msg-row ${isMine ? 'msg-outgoing' : 'msg-incoming'}`;
            row.id = `msg-${msg.id}`;

            row.innerHTML = `
                <div class="msg-bubble">
                    <div class="msg-header">
                        <span class="msg-sender">${msg.sender}</span>
                        <span class="msg-tag">${msg.is_ephemeral ? '🔥 30s' : '🔒 E2E'}</span>
                        <span class="msg-time">${timeStr}</span>
                    </div>
                    <div class="msg-text">${plain}</div>
                    <div class="msg-raw-toggle" onclick="this.nextElementSibling.classList.toggle('visible')">&gt; ver cifrado AES-256...</div>
                    <div class="msg-raw-data">IV: ${msg.iv}<br>DATA: ${msg.ciphertext.substring(0, 36)}...</div>
                </div>
            `;

            this.container.appendChild(row);
            this.container.scrollTop = this.container.scrollHeight;
            this.playChime(isMine);

            if (msg.is_ephemeral) {
                setTimeout(() => {
                    row.style.opacity = '0';
                    setTimeout(() => row.remove(), 400);
                }, 30000);
            }
        }

        clear() {
            if (this.container) this.container.innerHTML = '';
        }
    }

    window.ChatUI = ChatUI;
})();
