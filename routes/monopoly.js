// =========================================================================
// 🎲 MONOPOLY MULTIPLAYER ROUTER
// Arquitectura: Repository Pattern + Command Pattern + State Machine
// Soporta PostgreSQL y Fallback en Memoria para Alta Disponibilidad
// =========================================================================
const express = require('express');

module.exports = function(pool, ensureTable) {
  const router = express.Router();
  const memoryRooms = new Map();

  // Inicializar tabla de salas de Monopoly si PostgreSQL está activo
  async function ensureMonopolyTable() {
    const ok = await ensureTable();
    if (!ok) return false;
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS monopoly_rooms (
          code VARCHAR(16) PRIMARY KEY,
          name VARCHAR(60) NOT NULL,
          host_id VARCHAR(60) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'WAITING',
          state JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      return true;
    } catch (e) {
      return false;
    }
  }

  ensureMonopolyTable();

  // Helper Repository: Obtener sala por código
  async function getRoom(code) {
    const cleanCode = String(code || '').toUpperCase().trim();
    if (memoryRooms.has(cleanCode)) {
      return memoryRooms.get(cleanCode);
    }
    try {
      if (await ensureMonopolyTable()) {
        const res = await pool.query('SELECT state FROM monopoly_rooms WHERE code = $1', [cleanCode]);
        if (res.rows.length > 0) {
          const room = res.rows[0].state;
          memoryRooms.set(cleanCode, room);
          return room;
        }
      }
    } catch (e) {}
    return null;
  }

  // Helper Repository: Guardar estado de sala
  async function saveRoom(room) {
    room.updatedAt = Date.now();
    room.version = (room.version || 0) + 1;
    memoryRooms.set(room.code, room);
    try {
      if (await ensureMonopolyTable()) {
        await pool.query(
          `INSERT INTO monopoly_rooms (code, name, host_id, status, state, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (code) DO UPDATE SET
             status = EXCLUDED.status,
             host_id = EXCLUDED.host_id,
             state = EXCLUDED.state,
             updated_at = NOW()`,
          [room.code, room.name, room.hostId, room.status, JSON.stringify(room)]
        );
      }
    } catch (e) {}
    return room;
  }

  // 1. Listar salas en espera o en curso
  router.get('/rooms', async (req, res) => {
    try {
      if (await ensureMonopolyTable()) {
        const dbRes = await pool.query(
          `SELECT state FROM monopoly_rooms WHERE updated_at > NOW() - INTERVAL '6 hours' ORDER BY updated_at DESC LIMIT 20`
        );
        dbRes.rows.forEach(r => {
          if (r.state && r.state.code) memoryRooms.set(r.state.code, r.state);
        });
      }
    } catch (e) {}

    const list = Array.from(memoryRooms.values())
      .filter(r => Date.now() - (r.updatedAt || 0) < 6 * 3600 * 1000)
      .map(r => ({
        code: r.code,
        name: r.name,
        hostName: r.hostName,
        status: r.status,
        playerCount: (r.players || []).length,
        maxPlayers: r.maxPlayers || 4,
        version: r.version || 1
      }));

    res.json({ success: true, rooms: list });
  });

  // 2. Obtener estado completo de una sala específica
  router.get('/rooms/:code', async (req, res) => {
    const room = await getRoom(req.params.code);
    if (!room) return res.status(404).json({ success: false, error: 'Sala no encontrada' });
    res.json({ success: true, room });
  });

  // 3. Crear sala de espera
  router.post('/rooms', async (req, res) => {
    const { name, hostId, hostName, token, color } = req.body;
    if (!hostId || !hostName) {
      return res.status(400).json({ success: false, error: 'Faltan datos del anfitrión' });
    }
    const code = 'MNP-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const room = {
      code,
      name: String(name || `Sala de ${hostName}`).trim().substring(0, 40),
      hostId,
      hostName: String(hostName).trim().substring(0, 20),
      status: 'WAITING',
      maxPlayers: 4,
      version: 1,
      updatedAt: Date.now(),
      players: [{
        id: hostId,
        name: String(hostName).trim().substring(0, 20),
        token: token || '🛺',
        color: color || '#00f3ff',
        ready: true,
        isBot: false,
        money: 1500,
        position: 0,
        inJail: false,
        jailTurns: 0,
        bankrupt: false
      }],
      turnIndex: 0,
      turnPhase: 'ROLL',
      dice: [1, 1],
      properties: {},
      logs: [`🕹️ Sala ${code} creada por ${hostName}. Esperando jugadores...`]
    };

    await saveRoom(room);
    res.json({ success: true, room });
  });

  // 4. Unirse a sala de espera / Actualizar estado en Lobby
  router.post('/rooms/:code/join', async (req, res) => {
    const room = await getRoom(req.params.code);
    if (!room) return res.status(404).json({ success: false, error: 'Sala no existe' });

    const { playerId, playerName, token, color } = req.body;
    const existing = room.players.find(p => p.id === playerId);

    if (existing) {
      if (playerName) existing.name = String(playerName).trim().substring(0, 20);
      if (token) existing.token = token;
      if (color) existing.color = color;
    } else {
      if (room.status !== 'WAITING') {
        return res.status(400).json({ success: false, error: 'La partida ya comenzó' });
      }
      if (room.players.length >= (room.maxPlayers || 4)) {
        return res.status(400).json({ success: false, error: 'Sala llena (máx. 4 jugadores)' });
      }
      const cleanName = String(playerName || 'Jugador').trim().substring(0, 20);
      room.players.push({
        id: playerId,
        name: cleanName,
        token: token || '🦙',
        color: color || '#ff007f',
        ready: true,
        isBot: false,
        money: 1500,
        position: 0,
        inJail: false,
        jailTurns: 0,
        bankrupt: false
      });
      room.logs.push(`👾 ${cleanName} se unió a la sala de espera.`);
    }

    await saveRoom(room);
    res.json({ success: true, room });
  });

  // 5. Sincronizar comando/estado de juego (Command Dispatcher)
  router.post('/rooms/:code/sync', async (req, res) => {
    const room = await getRoom(req.params.code);
    if (!room) return res.status(404).json({ success: false, error: 'Sala no encontrada' });

    const { nextState, logEntry } = req.body;
    if (nextState) {
      room.status = nextState.status || room.status;
      room.players = nextState.players || room.players;
      room.turnIndex = nextState.turnIndex !== undefined ? nextState.turnIndex : room.turnIndex;
      room.turnPhase = nextState.turnPhase || room.turnPhase;
      room.dice = nextState.dice || room.dice;
      room.properties = nextState.properties || room.properties;
      room.lastCard = nextState.lastCard || null;
      room.winner = nextState.winner || null;
      if (Array.isArray(nextState.logs)) {
        room.logs = nextState.logs.slice(-40);
      }
    }
    if (logEntry) {
      room.logs.push(logEntry);
      if (room.logs.length > 40) room.logs.shift();
    }

    await saveRoom(room);
    res.json({ success: true, room });
  });

  return router;
};
