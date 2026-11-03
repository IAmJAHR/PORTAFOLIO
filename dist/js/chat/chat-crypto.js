// ==========================================
// 🔐 CHAT CRYPTO ENGINE - Mobile & Desktop Ready (<95 líneas)
// AES-256-GCM (HTTPS) + Pure UTF8 Stream (HTTP Universal)
// ==========================================
(function() {
    const hasSubtle = typeof window !== 'undefined' && window.crypto && !!window.crypto.subtle;
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    function hashKey(k) {
        let h = 0x811c9dc5;
        for (let i = 0; i < k.length; i++) {
            h ^= k.charCodeAt(i);
            h = Math.imul(h, 0x01000193) >>> 0;
        }
        return h;
    }

    function u8ToBase64(u8) {
        let bin = '';
        for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
        return btoa(bin);
    }

    function base64ToU8(b64) {
        const bin = atob(b64);
        const u8 = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        return u8;
    }

    function xorBytes(u8, pass, iv) {
        const out = new Uint8Array(u8.length);
        let s = (hashKey(pass) ^ hashKey(iv)) >>> 0;
        for (let i = 0; i < u8.length; i++) {
            s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
            out[i] = u8[i] ^ ((s >>> 16) & 0xFF);
        }
        return out;
    }

    async function getAesKey(pass) {
        const raw = await crypto.subtle.importKey('raw', enc.encode(pass), { name: 'PBKDF2' }, false, ['deriveKey']);
        return crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt: enc.encode('abel-crypto-2026'), iterations: 100000, hash: 'SHA-256' },
            raw, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
        );
    }

    class ChatCrypto {
        static async encrypt(plainText, pass = 'senku-ops') {
            const checksum = hashKey(pass).toString(16).padStart(8, '0');
            const payload = checksum + '::' + plainText;

            if (hasSubtle) {
                try {
                    const key = await getAesKey(pass);
                    const iv = crypto.getRandomValues(new Uint8Array(12));
                    const buf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(payload));
                    return { ciphertext: u8ToBase64(new Uint8Array(buf)), iv: u8ToBase64(iv) };
                } catch (e) {}
            }

            const rawIv = 'iv_' + Math.random().toString(36).substring(2, 14);
            const cipherBytes = xorBytes(enc.encode(payload), pass, rawIv);
            return { ciphertext: u8ToBase64(cipherBytes), iv: btoa(rawIv) };
        }

        static async decrypt(cipherB64, ivB64, pass = 'senku-ops') {
            const expectedSum = hashKey(pass).toString(16).padStart(8, '0');

            if (hasSubtle) {
                try {
                    const key = await getAesKey(pass);
                    const iv = base64ToU8(ivB64);
                    const decBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, base64ToU8(cipherB64));
                    const raw = dec.decode(decBuf);
                    if (raw.startsWith(expectedSum + '::')) return raw.substring(10);
                } catch (e) {}
            }

            try {
                const decBytes = xorBytes(base64ToU8(cipherB64), pass, atob(ivB64));
                const decStr = dec.decode(decBytes);
                if (decStr.startsWith(expectedSum + '::')) return decStr.substring(10);
            } catch (e) {}

            return '🔒 [MENSAJE CIFRADO // CLAVE REQUERIDA]';
        }
    }

    window.ChatCrypto = ChatCrypto;
})();
