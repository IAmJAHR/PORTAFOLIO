// ==========================================
// 💬 CHAT PROTOCOL ROUTES - Patrón: Express Router (<90 líneas)
// ==========================================
const express = require('express');

module.exports = function(pool, ensureTable) {
  const router = express.Router();
  let inMemoryFallback = [];

  // 1. Obtener mensajes recientes del canal
  router.get('/messages', async (req, res) => {
    const channel = (req.query.channel || 'general').toLowerCase();
    try {
      await ensureTable();
      const result = await pool.query(
        'SELECT id, channel, sender, ciphertext, iv, is_ephemeral, created_at FROM chat_messages WHERE channel = $1 ORDER BY id DESC LIMIT 40',
        [channel]
      );
      return res.json({ success: true, messages: result.rows.reverse() });
    } catch (err) {
      const filtered = inMemoryFallback.filter(m => m.channel === channel).slice(-40);
      return res.json({ success: true, source: 'fallback', messages: filtered });
    }
  });

  // 2. Enviar mensaje cifrado
  router.post('/messages', async (req, res) => {
    const { channel = 'general', sender = 'Anonymous', ciphertext, iv, isEphemeral = false } = req.body;

    if (!ciphertext || !iv) {
      return res.status(400).json({ success: false, error: 'Falta payload cifrado o IV' });
    }

    const cleanSender = String(sender).trim().substring(0, 30) || 'Operative';
    const cleanChan = String(channel).trim().toLowerCase().substring(0, 30);

    try {
      await ensureTable();
      const result = await pool.query(
        'INSERT INTO chat_messages (channel, sender, ciphertext, iv, is_ephemeral) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [cleanChan, cleanSender, ciphertext, iv, Boolean(isEphemeral)]
      );
      return res.json({ success: true, message: result.rows[0] });
    } catch (err) {
      const msg = {
        id: Date.now(),
        channel: cleanChan,
        sender: cleanSender,
        ciphertext,
        iv,
        is_ephemeral: Boolean(isEphemeral),
        created_at: new Date().toISOString()
      };
      inMemoryFallback.push(msg);
      if (inMemoryFallback.length > 100) inMemoryFallback.shift();
      return res.json({ success: true, source: 'fallback', message: msg });
    }
  });

  return router;
};
