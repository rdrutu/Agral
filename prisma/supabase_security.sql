-- Script de securitate pentru Supabase (RLS - Row Level Security)
-- Rulează acest script în Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Activează RLS pe tabelele principale
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 2. Politici pentru Tabela 'organizations'
-- Permite vizualizarea propriei organizații (dacă ești membru)
CREATE POLICY "Users can see their own organization"
ON organizations FOR SELECT
USING (id IN (
  SELECT org_id FROM users WHERE id = auth.uid()
));

-- 3. Politici pentru Tabela 'users'
-- Permite vizualizarea propriului profil
CREATE POLICY "Users can see their own profile"
ON users FOR SELECT
USING (id = auth.uid());

-- Permite update propriului profil
CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
USING (id = auth.uid());

-- 4. Politici pentru Tabela 'parcels'
-- Permite vizualizarea parcelelor din propria organizație
CREATE POLICY "Users can see parcels from their organization"
ON parcels FOR ALL
USING (org_id IN (
  SELECT org_id FROM users WHERE id = auth.uid()
));

-- 5. Politici pentru Tabela 'notifications'
-- Permite vizualizarea propriilor notificări
CREATE POLICY "Users can see their own notifications"
ON notifications FOR SELECT
USING (user_id = auth.uid() OR (org_id IN (SELECT org_id FROM users WHERE id = auth.uid())));

-- NOTE: Deoarece aplicația folosește Prisma pe server, Prisma se conectează de obicei cu drepturi de admin (bypass RLS).
-- Aceste politici sunt un strat de siguranță suplimentar în cazul în care Supabase Client este folosit direct în browser.

-- Pentru a permite Prisma să funcționeze corect pe tabele cu RLS, asigură-te că user-ul 'postgres' are drepturi de 'bypassrls' (deja implicit în Supabase).
