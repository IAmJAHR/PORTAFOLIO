// ==========================================
// 💬 CHAT PROTOCOL & ROOMS ROUTER (<90 líneas)
// Patrón: Express Router / Repository
// ==========================================
const express = require('express');

module.exports = function(pool, ensureTable) {
  const router = express.Router();
  let defaultRooms = [
    { name: 'general-ops', title: 'Operaciones Generales', is_private: false },
    { name: 'crypto-lab', title: 'Laboratorio Criptográfico', is_private: false },
    { name: 'enterprise-sap', title: 'Canal SAP B1 Core', is_private: true }
  ];
  let inMemoryMsgs = [];

  // 1. Obtener salas activas
  router.get('/rooms', async (req, res) => {
    try {
      await ensureTable();
      const r = await pool.query('SELECT name, title, is_private, created_by, created_at FROM chat_rooms ORDER BY id ASC');
      if (r.rows.length === 0) {
        for (const dr of defaultRooms) {
          await pool.query('INSERT INTO chat_rooms (name, title, is_private) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [dr.name, dr.title, dr.is_private]);
        }
        return res.json({ success: true, rooms: defaultRooms });
      }
      return res.json({ success: true, rooms: r.rows });
    } catch (e) {
      return res.json({ success: true, source: 'fallback', rooms: defaultRooms });
    }
  });

  // 2. Crear nueva sala
  router.post('/rooms', async (req, res) => {
    const { name, title, is_private = false, sender = 'Operative' } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Nombre de sala requerido' });
    const cleanName = String(name).toLowerCase().replace(/[^a-z0-9_-]/g, '').substring(0, 30);
    const cleanTitle = String(title || cleanName).trim().substring(0, 50);

    try {
      await ensureTable();
      const ins = await pool.query(
        'INSERT INTO chat_rooms (name, title, is_private, created_by) VALUES ($1, $2, $3, $4) ON CONFLICT (name) DO NOTHING RETURNING *',
        [cleanName, cleanTitle, Boolean(is_private), sender]
      );
      const room = ins.rows[0] || { name: cleanName, title: cleanTitle, is_private: Boolean(is_private) };
      return res.json({ success: true, room });
    } catch (e) {
      const room = { name: cleanName, title: cleanTitle, is_private: Boolean(is_private) };
      if (!defaultRooms.some(r => r.name === cleanName)) defaultRooms.push(room);
      return res.json({ success: true, source: 'fallback', room });
    }
  });

  // 3. Obtener mensajes del canal
  router.get('/messages', async (req, res) => {
    const channel = (req.query.channel || 'general-ops').toLowerCase();
    try {
      await ensureTable();
      const r = await pool.query('SELECT id, channel, sender, ciphertext, iv, is_ephemeral, created_at FROM chat_messages WHERE channel = $1 ORDER BY id DESC LIMIT 50', [channel]);
      return res.json({ success: true, messages: r.rows.reverse() });
    } catch (e) {
      return res.json({ success: true, messages: inMemoryMsgs.filter(m => m.channel === channel).slice(-50) });
    }
  });

  // 4. Enviar mensaje cifrado
  router.post('/messages', async (req, res) => {
    const { channel = 'general-ops', sender = 'Operative', ciphertext, iv, isEphemeral = false } = req.body;
    if (!ciphertext || !iv) return res.status(400).json({ success: false, error: 'Falta payload cifrado' });
    const cleanChan = String(channel).trim().toLowerCase().substring(0, 30);
    try {
      await ensureTable();
      const r = await pool.query('INSERT INTO chat_messages (channel, sender, ciphertext, iv, is_ephemeral) VALUES ($1, $2, $3, $4, $5) RETURNING *', [cleanChan, sender, ciphertext, iv, Boolean(isEphemeral)]);
      return res.json({ success: true, message: r.rows[0] });
    } catch (e) {
      const msg = { id: Date.now(), channel: cleanChan, sender, ciphertext, iv, is_ephemeral: Boolean(isEphemeral), created_at: new Date().toISOString() };
      inMemoryMsgs.push(msg); if (inMemoryMsgs.length > 120) inMemoryMsgs.shift();
      return res.json({ success: true, message: msg });
    }
  });

  return router;
};
