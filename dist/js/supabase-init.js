// Configuración de Supabase
const SUPABASE_URL = 'https://wsauzermjwpjofkracab.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzYXV6ZXJtandwam9ma3JhY2FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4OTgxOTIsImV4cCI6MjA4MDQ3NDE5Mn0._snQewx4IpuAY__TA1ZWr13wneyP06HTFWq8LhChodg';

// Inicializar cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Supabase inicializado');

// Función para crear la tabla si no existe (ejecutar una vez en la consola de Supabase SQL Editor)
/*
CREATE TABLE IF NOT EXISTS comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario TEXT NOT NULL,
  puntaje INTEGER NOT NULL,
  comentario TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para ordenar por puntaje
CREATE INDEX IF NOT EXISTS idx_comentarios_puntaje ON comentarios(puntaje DESC);
*/
