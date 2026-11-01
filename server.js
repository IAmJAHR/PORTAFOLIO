const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 80;

app.use(cors());
app.use(express.json());

// --- CONFIGURACIÓN DE POSTGRESQL ---
const dbUrl = process.env.DATABASE_URL || 
  (process.env.POSTGRES_HOST ? 
    `postgres://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || ''}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB || 'postgres'}` 
    : 'postgresql://postgres:hrknf15asjmljhrz@portafolioabel-postgresdb-itf04m:5432/postgres');

// Solo usar SSL si el proveedor remoto lo requiere (Dokploy interno NO usa SSL)
const needsSsl = dbUrl.includes('sslmode=require') || 
                 dbUrl.includes('supabase.co') || 
                 dbUrl.includes('neon.tech') || 
                 dbUrl.includes('render.com');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000
});

// Inicialización resiliente de la tabla
let tableReady = false;
async function ensureTable() {
  if (tableReady) return true;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scores (
        id SERIAL PRIMARY KEY,
        usuario VARCHAR(60) NOT NULL,
        puntaje INT NOT NULL,
        game VARCHAR(30) DEFAULT 'tetris',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_scores_game_puntaje ON scores(game, puntaje DESC);
    `);
    tableReady = true;
    console.log('✅ PostgreSQL: Tabla scores verificada y lista.');
    return true;
  } catch (err) {
    console.error('⚠️ PostgreSQL ensureTable falló:', err.message);
    tableReady = false;
    return false;
  }
}

// Intentar inicializar de inmediato al arrancar
ensureTable();

// --- ALMACENAMIENTO FALLBACK EN CASO DE EMERGENCIA ---
const FALLBACK_FILE = path.join(__dirname, 'scores_fallback.json');

function readFallbackScores(game = 'tetris') {
  try {
    if (!fs.existsSync(FALLBACK_FILE)) return [];
    const data = JSON.parse(fs.readFileSync(FALLBACK_FILE, 'utf8'));
    return (data[game] || []).sort((a, b) => b.puntaje - a.puntaje).slice(0, 10);
  } catch (e) {
    return [];
  }
}

function saveFallbackScore(usuario, puntaje, game = 'tetris') {
  try {
    let data = {};
    if (fs.existsSync(FALLBACK_FILE)) {
      data = JSON.parse(fs.readFileSync(FALLBACK_FILE, 'utf8'));
    }
    if (!data[game]) data[game] = [];
    data[game].push({ usuario, puntaje, created_at: new Date().toISOString() });
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error guardando en fallback:', e);
  }
}

// --- ENDPOINTS DE LA API ---

// 1. Obtener Top 10 Puntajes
app.get('/api/scores', async (req, res) => {
  const game = (req.query.game || 'tetris').toLowerCase();

  try {
    await ensureTable();
    const result = await pool.query(
      'SELECT id, usuario, puntaje, created_at FROM scores WHERE game = $1 ORDER BY puntaje DESC LIMIT 10',
      [game]
    );
    return res.json({ success: true, source: 'postgres', scores: result.rows });
  } catch (err) {
    console.error('⚠️ Error al consultar Postgres, usando fallback:', err.message);
    const scores = readFallbackScores(game);
    return res.json({ success: true, source: 'fallback', scores, error: err.message });
  }
});

// 2. Guardar Puntaje
app.post('/api/scores', async (req, res) => {
  const { usuario, puntaje, game } = req.body;
  const gameType = (game || 'tetris').toLowerCase();

  if (!usuario || puntaje === undefined) {
    return res.status(400).json({ success: false, error: 'Falta usuario o puntaje' });
  }

  const cleanName = String(usuario).trim().substring(0, 40) || 'Anónimo';
  const cleanScore = parseInt(puntaje, 10) || 0;

  try {
    await ensureTable();
    const result = await pool.query(
      'INSERT INTO scores (usuario, puntaje, game) VALUES ($1, $2, $3) RETURNING *',
      [cleanName, cleanScore, gameType]
    );
    console.log(`✅ Récord guardado en PostgreSQL: ${cleanName} - ${cleanScore} pts (${gameType})`);
    return res.json({ success: true, source: 'postgres', record: result.rows[0] });
  } catch (err) {
    console.error('⚠️ Error al guardar en Postgres, usando fallback:', err.message);
    saveFallbackScore(cleanName, cleanScore, gameType);
    return res.json({
      success: true,
      source: 'fallback',
      record: { usuario: cleanName, puntaje: cleanScore },
      dbError: err.message
    });
  }
});

// 3. Health Check detallado
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let dbError = null;
  let totalScores = 0;

  try {
    const ok = await ensureTable();
    if (ok) {
      const countRes = await pool.query('SELECT COUNT(*) FROM scores');
      totalScores = parseInt(countRes.rows[0].count, 10);
      dbStatus = 'connected';
    }
  } catch (e) {
    dbError = e.message;
  }

  res.json({
    status: 'ok',
    database: {
      status: dbStatus,
      totalScores,
      error: dbError,
      url: dbUrl.replace(/:[^:@]+@/, ':***@')
    },
    timestamp: new Date().toISOString()
  });
});

// --- SERVICIO DE ARCHIVOS ESTÁTICOS ---
express.static.mime.define({
  'application/xml': ['dae'],
  'model/gltf-binary': ['glb'],
  'model/gltf+json': ['gltf']
});

app.use(express.static(path.join(__dirname), {
  maxAge: '1h',
  setHeaders: (res, pathStr) => {
    if (pathStr.endsWith('.html') || pathStr.endsWith('.js') || pathStr.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});
