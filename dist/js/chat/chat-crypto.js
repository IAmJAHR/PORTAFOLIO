// ==========================================
// 🔐 CHAT CRYPTO ENGINE - Universal Cross-Device (<95 líneas)
// Compatible 100% entre PC y Celular (HTTP & HTTPS)
// ==========================================
(function() {
    const hasSubtle = typeof window !== 'undefined' && window.crypto && !!window.crypto.subtle;
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    function normPass(p) {
        return String(p || 'senku-ops').trim() || 'senku-ops';
    }

    function hashKey(k) {
        let h = 0x811c9dc5;
        for (let i = 0; i < k.length; i++) {
            h ^= k.charCodeAt(i);
            h = Math.imul(h, 0x01000193) >>> 0;
        }
        return h >>> 0;
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

    function xorBytes(u8, pass, ivStr) {
        const out = new Uint8Array(u8.length);
        let s = (hashKey(pass) ^ hashKey(ivStr)) >>> 0;
        for (let i = 0; i < u8.length; i++) {
            s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
            out[i] = u8[i] ^ ((s >>> 16) & 0xFF) ^ (s & 0xFF);
        }
        return out;
    }

    function xorBytesLegacy(u8, pass, ivStr) {
        const out = new Uint8Array(u8.length);
        let s = (hashKey(pass) ^ hashKey(ivStr)) >>> 0;
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

    async function tryDecryptWithKey(cipherB64, ivB64, cleanPass) {
        const expectedSum = hashKey(cleanPass).toString(16).padStart(8, '0') + '::';
        const cipherU8 = base64ToU8(cipherB64);

        try {
            const ivStr = atob(ivB64);
            const raw1 = dec.decode(xorBytes(cipherU8, cleanPass, ivStr));
            if (raw1.startsWith(expectedSum)) return raw1.substring(10);
            const raw2 = dec.decode(xorBytesLegacy(cipherU8, cleanPass, ivStr));
            if (raw2.startsWith(expectedSum)) return raw2.substring(10);
        } catch (e) {}

        if (hasSubtle) {
            try {
                const key = await getAesKey(cleanPass);
                const decBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64ToU8(ivB64) }, key, cipherU8);
                const raw3 = dec.decode(decBuf);
                if (raw3.startsWith(expectedSum)) return raw3.substring(10);
            } catch (e) {}
        }
        return null;
    }

    class ChatCrypto {
        static async encrypt(plainText, pass = 'senku-ops') {
            const cleanPass = normPass(pass);
            const checksum = hashKey(cleanPass).toString(16).padStart(8, '0');
            const payload = checksum + '::' + plainText;
            const rawIv = 'u26_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
            const cipherBytes = xorBytes(enc.encode(payload), cleanPass, rawIv);
            return { ciphertext: u8ToBase64(cipherBytes), iv: btoa(rawIv) };
        }

        static async decrypt(cipherB64, ivB64, pass = 'senku-ops') {
            const cleanPass = normPass(pass);
            let res = await tryDecryptWithKey(cipherB64, ivB64, cleanPass);
            if (res !== null) return { ok: true, text: res };
            if (cleanPass !== 'senku-ops') {
                res = await tryDecryptWithKey(cipherB64, ivB64, 'senku-ops');
                if (res !== null) return { ok: true, text: res };
            }
            return { ok: false, text: 'Mensaje protegido con clave privada' };
        }
    }

    window.ChatCrypto = ChatCrypto;
})();
