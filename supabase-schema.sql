-- ============================================
-- Americano Padel — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- Table des tournois (stocke l'état complet en JSONB)
CREATE TABLE tournaments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Tournoi',
  config JSONB NOT NULL DEFAULT '{"courts": 2, "pointsPerMatch": 20, "nbRounds": 3}',
  players JSONB NOT NULL DEFAULT '[]',
  rounds JSONB NOT NULL DEFAULT '[]',
  current_round INTEGER DEFAULT 0,
  status TEXT DEFAULT 'setup' CHECK (status IN ('setup', 'in_progress', 'completed')),
  ranking JSONB DEFAULT '[]',
  winner JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Index pour les requêtes courantes
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_created ON tournaments(created_at DESC);

-- Enable Row Level Security (RLS) — open access for now (no auth)
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

-- Policy: anyone can read all tournaments
CREATE POLICY "Public read access" ON tournaments
  FOR SELECT USING (true);

-- Policy: anyone can insert tournaments
CREATE POLICY "Public insert access" ON tournaments
  FOR INSERT WITH CHECK (true);

-- Policy: anyone can update tournaments
CREATE POLICY "Public update access" ON tournaments
  FOR UPDATE USING (true);

-- Policy: anyone can delete tournaments
CREATE POLICY "Public delete access" ON tournaments
  FOR DELETE USING (true);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE tournaments;
