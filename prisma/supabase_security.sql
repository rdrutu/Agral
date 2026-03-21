-- =============================================================================
-- SCRIPT SECURITATE COMPLET (RLS) - AGRAL (VERSIUNE OPTIMIZATĂ)
-- =============================================================================

-- 0. INDEXURI PENTRU PERFORMANȚĂ
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_parcels_org_id ON parcels(org_id);

-- 1. FUNCȚIE SECURITY DEFINER PENTRU PERFORMANȚĂ (Evităm subquery-uri repetate)
-- Această funcție cache-uiește org_id-ul pentru sesiunea curentă.
CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS uuid AS $$
BEGIN
  RETURN (SELECT org_id FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- 2. ACTIVARE RLS PE TOATE TABELELE
DO $$ 
DECLARE 
    t record;
BEGIN
    FOR t IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t.tablename);
    END LOOP;
END $$;

-- 3. POLITICI PENTRU 'users'
DROP POLICY IF EXISTS "Users see self" ON users;
CREATE POLICY "Users see self" ON users FOR SELECT USING (users.id = auth.uid());
CREATE POLICY "Users update self" ON users FOR UPDATE USING (users.id = auth.uid()) WITH CHECK (users.id = auth.uid());

-- 4. POLITICI PENTRU 'organizations'
DROP POLICY IF EXISTS "Org members see org" ON organizations;
CREATE POLICY "Org members see org" ON organizations FOR SELECT 
USING (organizations.id = get_my_org_id());

-- 5. TABELE BAZATE PE 'org_id' (Izolare Organizație)
DO $$ 
DECLARE 
    tbl text;
    tables text[] := ARRAY[
        'parcels', 'seasons', 'agricultural_operations', 'inventory_items', 
        'financial_transactions', 'sales', 'lease_contracts', 'parcel_groups', 
        'weather_pois', 'subscription_payments', 'vehicles', 'notifications'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Org isolation %I" ON %I', tbl, tbl);
        EXECUTE format('CREATE POLICY "Org isolation %1$I" ON %1$I FOR ALL USING (%1$I.org_id = get_my_org_id()) WITH CHECK (%1$I.org_id = get_my_org_id())', tbl);
    END LOOP;
END $$;

-- 6. TABELE COPIL (Legate prin ID de părinte)
-- Crop Plans (legate de parcelă)
CREATE POLICY "Crop plans isolation" ON crop_plans FOR ALL 
USING (crop_plans.parcel_id IN (SELECT p.id FROM parcels p WHERE p.org_id = get_my_org_id()))
WITH CHECK (crop_plans.parcel_id IN (SELECT p.id FROM parcels p WHERE p.org_id = get_my_org_id()));

-- Mentenanță Vehicule (legate de vehicul)
CREATE POLICY "Vehicle maintenance isolation" ON vehicle_maintenance FOR ALL 
USING (vehicle_maintenance.vehicle_id IN (SELECT v.id FROM vehicles v WHERE v.org_id = get_my_org_id()))
WITH CHECK (vehicle_maintenance.vehicle_id IN (SELECT v.id FROM vehicles v WHERE v.org_id = get_my_org_id()));

-- Loturi Inventar (legate de produs)
CREATE POLICY "Inventory lots isolation" ON inventory_lots FOR ALL 
USING (inventory_lots.inventory_item_id IN (SELECT i.id FROM inventory_items i WHERE i.org_id = get_my_org_id()))
WITH CHECK (inventory_lots.inventory_item_id IN (SELECT i.id FROM inventory_items i WHERE i.org_id = get_my_org_id()));

-- Tranzacții Inventar (legate de lot)
CREATE POLICY "Inventory trans isolation" ON inventory_transactions FOR ALL 
USING (inventory_transactions.inventory_lot_id IN (SELECT il.id FROM inventory_lots il JOIN inventory_items i ON il.inventory_item_id = i.id WHERE i.org_id = get_my_org_id()))
WITH CHECK (inventory_transactions.inventory_lot_id IN (SELECT il.id FROM inventory_lots il JOIN inventory_items i ON il.inventory_item_id = i.id WHERE i.org_id = get_my_org_id()));

-- 7. CHAT & SUPORT
CREATE POLICY "Chat view" ON chat_conversations FOR SELECT 
USING (chat_conversations.user_id = auth.uid() OR chat_conversations.moderator_id = auth.uid());

CREATE POLICY "Message view" ON chat_messages FOR ALL 
USING (chat_messages.conversation_id IN (SELECT c.id FROM chat_conversations c WHERE c.user_id = auth.uid() OR c.moderator_id = auth.uid()))
WITH CHECK (chat_messages.conversation_id IN (SELECT c.id FROM chat_conversations c WHERE c.user_id = auth.uid() OR c.moderator_id = auth.uid()));

CREATE POLICY "Support config view" ON support_configs FOR SELECT USING (true);
