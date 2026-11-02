// ==========================================
// 🔐 CHAT CRYPTO MODULE - Dual Engine (<95 líneas)
// Soporta Web Crypto API (HTTPS) + Fallback Universal (HTTP)
// ==========================================
(function() {
    const hasSubtle = typeof window !== 'undefined' && window.crypto && !!window.crypto.subtle;
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    function fallbackStream(text, key, iv) {
        let kBytes = [];
        for (let i = 0; i < 32; i++) {
            kBytes.push((key.charCodeAt(i % key.length) * 37 + (iv.charCodeAt(i % iv.length) || 17) + i * 11) % 256);
        }
        let out = '';
        for (let i = 0; i < text.length; i++) {
            const k = kBytes[i % 32] ^ ((i * 13 + 7) & 0xFF);
            out += String.fromCharCode(text.charCodeAt(i) ^ k);
        }
        return out;
    }

    async function deriveKey(passphrase) {
        const keyMaterial = await crypto.subtle.importKey(
            'raw', enc.encode(passphrase), { name: 'PBKDF2' }, false, ['deriveKey']
        );
        return crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt: enc.encode('abel-salt-2026'), iterations: 100000, hash: 'SHA-256' },
            keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
        );
    }

    class ChatCrypto {
        static async encrypt(plainText, passphrase) {
            const safePass = passphrase || 'senku-protocol-2026';
            if (hasSubtle) {
                try {
                    const key = await deriveKey(safePass);
                    const iv = crypto.getRandomValues(new Uint8Array(12));
                    const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plainText));
                    return {
                        ciphertext: btoa(String.fromCharCode(...new Uint8Array(cipherBuf))),
                        iv: btoa(String.fromCharCode(...iv))
                    };
                } catch (e) {
                    console.warn('Fallback a cifrado HTTP:', e.message);
                }
            }

            // Fallback transparente para entornos HTTP
            const rawIv = 'iv_' + Math.random().toString(36).substring(2, 14);
            const encoded = unescape(encodeURIComponent(plainText));
            const cipher = fallbackStream(encoded, safePass, rawIv);
            return {
                ciphertext: btoa(cipher),
                iv: btoa(rawIv)
            };
        }

        static async decrypt(cipherBase64, ivBase64, passphrase) {
            const safePass = passphrase || 'senku-protocol-2026';
            if (hasSubtle) {
                try {
                    const key = await deriveKey(safePass);
                    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
                    const cipherBytes = Uint8Array.from(atob(cipherBase64), c => c.charCodeAt(0));
                    const decBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherBytes);
                    return dec.decode(decBuf);
                } catch (e) {}
            }

            // Descifrado Fallback HTTP
            try {
                const rawCipher = atob(cipherBase64);
                const rawIv = atob(ivBase64);
                const decStr = fallbackStream(rawCipher, safePass, rawIv);
                return decodeURIComponent(escape(decStr));
            } catch (err) {
                return '[🔒 PAYLOAD CIFRADO // LLAVE REQUERIDA]';
            }
        }
    }

    window.ChatCrypto = ChatCrypto;
})();
