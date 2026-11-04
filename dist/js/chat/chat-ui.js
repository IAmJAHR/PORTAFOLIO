// ==========================================
// 🎨 CHAT UI - Patrón: View / Component (<85 líneas)
// ==========================================
(function() {
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

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
                osc.frequency.exponentialRampToValueAtTime(isSent ? 1320 : 880, this.audioCtx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.03, this.audioCtx.currentTime);
                gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.1);
                osc.connect(gain); gain.connect(this.audioCtx.destination);
                osc.start(); osc.stop(this.audioCtx.currentTime + 0.11);
            } catch (e) {}
        }

        async appendMessage(msg, isMine = false) {
            if (!this.container) return;
            const decRes = await window.ChatCrypto.decrypt(msg.ciphertext, msg.iv, this.state.passphrase);
            const isOk = typeof decRes === 'object' ? decRes.ok : !String(decRes).includes('MENSAJE CIFRADO');
            const plain = typeof decRes === 'object' ? decRes.text : decRes;
            const timeStr = new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const row = document.createElement('div');
            row.className = `msg-row ${isMine ? 'msg-outgoing' : 'msg-incoming'}`;
            row.id = `msg-${msg.id}`;

            const bodyHtml = isOk
                ? `<div class="msg-text">${escapeHtml(plain)}</div>`
                : `<div class="msg-locked-card">
                       <span class="msg-locked-label"><i class="fas fa-lock"></i> Cifrado con otra clave E2E</span>
                       <button type="button" class="btn-unlock-inline" onclick="window.openKeyModal && window.openKeyModal()">
                           <i class="fas fa-key"></i> Ingresar clave
                       </button>
                   </div>`;

            row.innerHTML = `
                <div class="msg-bubble ${!isOk ? 'msg-bubble-locked' : ''}">
                    <div class="msg-header">
                        <span class="msg-sender">${escapeHtml(msg.sender)}</span>
                        <span class="msg-tag">${msg.is_ephemeral ? '🔥 30s' : '🔒 E2E'}</span>
                        <span class="msg-time">${timeStr}</span>
                    </div>
                    ${bodyHtml}
                    <div class="msg-raw-toggle" onclick="this.nextElementSibling.classList.toggle('visible')">&gt; payload AES-256</div>
                    <div class="msg-raw-data">IV: ${escapeHtml(msg.iv)}<br>HEX: ${escapeHtml(msg.ciphertext.substring(0, 32))}...</div>
                </div>
            `;

            this.container.appendChild(row);
            this.container.scrollTop = this.container.scrollHeight;

            if (msg.is_ephemeral) {
                setTimeout(() => {
                    row.style.opacity = '0';
                    setTimeout(() => row.remove(), 400);
                }, 30000);
            }
        }

        clear() {
            if (!this.container) return;
            this.container.innerHTML = `
                <div class="chat-room-banner">
                    <i class="fas fa-shield-halved"></i>
                    <span>SALA <strong>#${escapeHtml(this.state.channel)}</strong> // CIFRADO E2E ACTIVO</span>
                </div>
            `;
        }
    }

    window.ChatUI = ChatUI;
})();
