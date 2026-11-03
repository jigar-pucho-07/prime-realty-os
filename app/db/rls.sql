-- db/rls.sql — GENERATED from os.yaml scopes (roles[].scope + `Col={{user}}` page filters). Idempotent. Applied by
-- scripts/db.mjs migrate after roles.sql. Defense in depth: the DAL already scopes queries; these policies make Postgres refuse
-- cross-scope rows for a login IN ROLE app too. db.mjs applies the FORCE lines only when the migrating login is a superuser /
-- BYPASSRLS or a member of `app` (a non-superuser owner outside `app` would otherwise see zero rows) and warns otherwise.

ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leads" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leads_scope" ON "leads";
CREATE POLICY "leads_scope" ON "leads" FOR ALL TO app
  USING (current_setting('pucho.unscoped', true) = '1' OR lower(trim("broker"::text)) IN (nullif(lower(trim(current_setting('pucho.scope', true))), ''), nullif(lower(trim(current_setting('pucho.scope_email', true))), '')))
  WITH CHECK (current_setting('pucho.unscoped', true) = '1' OR lower(trim("broker"::text)) IN (nullif(lower(trim(current_setting('pucho.scope', true))), ''), nullif(lower(trim(current_setting('pucho.scope_email', true))), '')));
DROP POLICY IF EXISTS "leads_studio_read" ON "leads";
CREATE POLICY "leads_studio_read" ON "leads" FOR SELECT TO studio_reader USING (true);

ALTER TABLE "followups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "followups" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "followups_scope" ON "followups";
CREATE POLICY "followups_scope" ON "followups" FOR ALL TO app
  USING (current_setting('pucho.unscoped', true) = '1' OR lower(trim("broker"::text)) IN (nullif(lower(trim(current_setting('pucho.scope', true))), ''), nullif(lower(trim(current_setting('pucho.scope_email', true))), '')))
  WITH CHECK (current_setting('pucho.unscoped', true) = '1' OR lower(trim("broker"::text)) IN (nullif(lower(trim(current_setting('pucho.scope', true))), ''), nullif(lower(trim(current_setting('pucho.scope_email', true))), '')));
DROP POLICY IF EXISTS "followups_studio_read" ON "followups";
CREATE POLICY "followups_studio_read" ON "followups" FOR SELECT TO studio_reader USING (true);

ALTER TABLE "bookings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bookings" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bookings_scope" ON "bookings";
CREATE POLICY "bookings_scope" ON "bookings" FOR ALL TO app
  USING (current_setting('pucho.unscoped', true) = '1' OR lower(trim("broker"::text)) IN (nullif(lower(trim(current_setting('pucho.scope', true))), ''), nullif(lower(trim(current_setting('pucho.scope_email', true))), '')))
  WITH CHECK (current_setting('pucho.unscoped', true) = '1' OR lower(trim("broker"::text)) IN (nullif(lower(trim(current_setting('pucho.scope', true))), ''), nullif(lower(trim(current_setting('pucho.scope_email', true))), '')));
DROP POLICY IF EXISTS "bookings_studio_read" ON "bookings";
CREATE POLICY "bookings_studio_read" ON "bookings" FOR SELECT TO studio_reader USING (true);

ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "messages" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "messages_scope" ON "messages";
CREATE POLICY "messages_scope" ON "messages" FOR ALL TO app
  USING (current_setting('pucho.unscoped', true) = '1' OR lower(trim("broker"::text)) IN (nullif(lower(trim(current_setting('pucho.scope', true))), ''), nullif(lower(trim(current_setting('pucho.scope_email', true))), '')))
  WITH CHECK (current_setting('pucho.unscoped', true) = '1' OR lower(trim("broker"::text)) IN (nullif(lower(trim(current_setting('pucho.scope', true))), ''), nullif(lower(trim(current_setting('pucho.scope_email', true))), '')));
DROP POLICY IF EXISTS "messages_studio_read" ON "messages";
CREATE POLICY "messages_studio_read" ON "messages" FOR SELECT TO studio_reader USING (true);

ALTER TABLE "calls" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "calls" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "calls_scope" ON "calls";
CREATE POLICY "calls_scope" ON "calls" FOR ALL TO app
  USING (current_setting('pucho.unscoped', true) = '1' OR lower(trim("broker"::text)) IN (nullif(lower(trim(current_setting('pucho.scope', true))), ''), nullif(lower(trim(current_setting('pucho.scope_email', true))), '')))
  WITH CHECK (current_setting('pucho.unscoped', true) = '1' OR lower(trim("broker"::text)) IN (nullif(lower(trim(current_setting('pucho.scope', true))), ''), nullif(lower(trim(current_setting('pucho.scope_email', true))), '')));
DROP POLICY IF EXISTS "calls_studio_read" ON "calls";
CREATE POLICY "calls_studio_read" ON "calls" FOR SELECT TO studio_reader USING (true);
