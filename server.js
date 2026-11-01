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
let pool = null;
let isDbConnected = false;

const dbUrl = process.env.DATABASE_URL || 
  (process.env.POSTGRES_HOST ? 
    `postgres://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || ''}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB || 'portafolio'}` 
    : 'postgresql://postgres:hrknf15asjmljhrz@portafolioabel-postgresdb-itf04m:5432/postgres');

if (dbUrl) {
  pool = new Pool({
    connectionString: dbUrl,
    ssl: process.env.NODE_ENV === 'production' && !dbUrl.includes('dokploy') && !dbUrl.includes('localhost') ? { rejectUnauthorized: false } : false
  });

  // Inicializar tabla en PostgreSQL
  initDatabase();
} else {
  console.log('ℹ️ No se detectó DATABASE_URL. Usando almacenamiento local fallback.');
}

async function initDatabase() {
  if (!pool) return;
  try {
    const client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS scores (
        id SERIAL PRIMARY KEY,
        usuario VARCHAR(60) NOT NULL,
        puntaje INT NOT NULL,
        game VARCHAR(30) DEFAULT 'tetris',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_scores_game_puntaje ON scores(game, puntaje DESC);
    `);
    client.release();
    isDbConnected = true;
    console.log('✅ PostgreSQL conectado e inicializado con éxito.');
  } catch (err) {
    console.error('⚠️ Error al conectar a PostgreSQL:', err.message);
    isDbConnected = false;
  }
}

// Fallback local en archivo JSON por si la DB no está disponible
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
  
  if (isDbConnected && pool) {
    try {
      const result = await pool.query(
        'SELECT id, usuario, puntaje, created_at FROM scores WHERE game = $1 ORDER BY puntaje DESC LIMIT 10',
        [game]
      );
      return res.json({ success: true, source: 'postgres', scores: result.rows });
    } catch (err) {
      console.error('Error al consultar Postgres:', err.message);
    }
  }

  // Fallback si la DB está cargando
  const scores = readFallbackScores(game);
  res.json({ success: true, source: 'local', scores });
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

  if (isDbConnected && pool) {
    try {
      const result = await pool.query(
        'INSERT INTO scores (usuario, puntaje, game) VALUES ($1, $2, $3) RETURNING *',
        [cleanName, cleanScore, gameType]
      );
      return res.json({ success: true, source: 'postgres', record: result.rows[0] });
    } catch (err) {
      console.error('Error al insertar en Postgres:', err.message);
    }
  }

  // Fallback local
  saveFallbackScore(cleanName, cleanScore, gameType);
  res.json({ success: true, source: 'local', record: { usuario: cleanName, puntaje: cleanScore } });
});

// 3. Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: isDbConnected ? 'PostgreSQL Conectado' : 'Modo Fallback / Desconectado',
    timestamp: new Date().toISOString()
  });
});

// --- SERVICIO DE ARCHIVOS ESTÁTICOS ---
// Configurar MIME types personalizados para Three.js y fuentes
express.static.mime.define({
  'application/xml': ['dae'],
  'model/gltf-binary': ['glb'],
  'model/gltf+json': ['gltf']
});

app.use(express.static(path.join(__dirname), {
  maxAge: '7d',
  setHeaders: (res, pathStr) => {
    if (pathStr.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Fallback a index.html para cualquier ruta no encontrada
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});
