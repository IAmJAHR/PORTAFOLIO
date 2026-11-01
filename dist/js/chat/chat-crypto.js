// ==========================================
// 🔐 CHAT CRYPTO MODULE - Web Crypto API (<85 líneas)
// Patrón: Strategy / Encryption Module (AES-GCM 256)
// ==========================================
(function() {
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    async function deriveKey(passphrase) {
        const keyMaterial = await crypto.subtle.importKey(
            'raw', enc.encode(passphrase), { name: 'PBKDF2' }, false, ['deriveKey']
        );
        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: enc.encode('abel-secure-salt-2026'),
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    class ChatCrypto {
        static async encrypt(plainText, passphrase) {
            const key = await deriveKey(passphrase);
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const cipherBuffer = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv }, key, enc.encode(plainText)
            );

            return {
                ciphertext: btoa(String.fromCharCode(...new Uint8Array(cipherBuffer))),
                iv: btoa(String.fromCharCode(...iv))
            };
        }

        static async decrypt(cipherBase64, ivBase64, passphrase) {
            try {
                const key = await deriveKey(passphrase);
                const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
                const cipherBytes = Uint8Array.from(atob(cipherBase64), c => c.charCodeAt(0));

                const decryptedBuffer = await crypto.subtle.decrypt(
                    { name: 'AES-GCM', iv }, key, cipherBytes
                );
                return dec.decode(decryptedBuffer);
            } catch (err) {
                return '[🔒 PAYLOAD CIFRADO // LLAVE ASIMÉTRICA REQUERIDA]';
            }
        }
    }

    window.ChatCrypto = ChatCrypto;
})();
