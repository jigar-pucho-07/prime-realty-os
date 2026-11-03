-- db/schema.sql — GENERATED from os.yaml by pucho-os (2026-11-03). Idempotent: apply, then apply again.
-- Entity tables are named after os.yaml entities; columns are the declared names in lower case.

-- db/base.sql — the tables every Pucho OS has, whatever os.yaml says: people, sessions, one-time codes, files, jobs, settings, roles.
-- Idempotent (standards §5): safe to apply twice. Entity tables follow in db/schema.sql, generated from os.yaml.
-- Roles (§19.1 least privilege) are created by scripts/db.mjs migrate when the connected user may create roles —
-- `app` (DML on every table), `studio_reader` (SELECT on entity tables only — never users, sessions, otp_codes, files).

CREATE TABLE IF NOT EXISTS users (
  id              text PRIMARY KEY,
  email           text NOT NULL UNIQUE,
  name            text NOT NULL,
  role            text NOT NULL,
  password_hash   text,                       -- $argon2id$… or NULL until the person sets one (one-time code sign-in still works)
  must_change_password boolean NOT NULL DEFAULT false,
  is_active       boolean NOT NULL DEFAULT true,
  deactivated_at  timestamptz,
  deactivated_by  text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash      text PRIMARY KEY,           -- SHA-256 of the opaque cookie token; the token itself is never stored
  user_id         text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  last_seen_at    timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL,
  user_agent      text
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);

CREATE TABLE IF NOT EXISTS otp_codes (
  email           text NOT NULL,
  code_hash       text NOT NULL,              -- HMAC-SHA256(code, AUTH_PEPPER)
  expires_at      timestamptz NOT NULL,
  attempts        integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (email)
);

CREATE TABLE IF NOT EXISTS files (                -- uploads live in the database (D6), under the plan's storage cap
  id              text PRIMARY KEY,
  name            text NOT NULL,
  mime            text NOT NULL,
  size            bigint NOT NULL,
  data            bytea NOT NULL,
  entity          text,
  record_id       text,
  uploaded_by     text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobs (                 -- a flow that runs longer than the sync window (async: true) is tracked here
  id              text PRIMARY KEY,
  flow            text NOT NULL,
  action          text NOT NULL,
  status          text NOT NULL DEFAULT 'queued', -- queued · done · failed
  payload         jsonb,
  result          jsonb,
  requested_by    text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  finished_at     timestamptz
);

CREATE TABLE IF NOT EXISTS signin_attempts (      -- sign-in rate limit per account and per address (§19.2)
  key             text PRIMARY KEY,
  count           integer NOT NULL DEFAULT 0,
  window_start    timestamptz NOT NULL DEFAULT now()
);

-- v5.1 · the app's own settings, edited by an administrator in Settings (app_url, inbound_token, inbound_token_prev,
-- inbound_token_prev_until, company_name, app_name, webhook:<FLOW>). A missing key falls back to the environment.
CREATE TABLE IF NOT EXISTS app_settings (key text PRIMARY KEY, value text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now(), updated_by text);

-- v5.1 · roles (Level 2): a role = label + description + pages, each page `view` or `edit`. base_role = the built-in role it
-- started from (record scope + home). The os.yaml roles are inserted by db/schema.sql (built_in = true), never overwritten.
CREATE TABLE IF NOT EXISTS app_roles (key text PRIMARY KEY, label text NOT NULL, description text NOT NULL DEFAULT '', base_role text NOT NULL,
  pages jsonb NOT NULL DEFAULT '{}', built_in boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by text);

-- ALTERs below every CREATE (§5): a column added after the first release lands here, never above its table.
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_email boolean NOT NULL DEFAULT false;   -- v5.1 temporary admin (G8)


CREATE TABLE IF NOT EXISTS "leads" (
  "lead_id" text PRIMARY KEY,
  "created_at" timestamptz,
  "name" text,
  "phone" text,
  "source" text,
  "stage" text,
  "purpose" text,
  "property_type" text,
  "bhk" text,
  "area_pref" text,
  "budget_min_inr" numeric,
  "budget_max_inr" numeric,
  "property_interest" text,
  "broker" text,
  "ai_mode" text,
  "lang" text,
  "last_message" text,
  "last_message_at" timestamptz,
  "next_followup_at" timestamptz,
  "followup_reason" text,
  "lost_reason" text,
  "summary" text,
  "history" text,
  _seq bigserial
);
CREATE UNIQUE INDEX IF NOT EXISTS "leads_phone_uq" ON "leads" ("phone");
CREATE INDEX IF NOT EXISTS "leads_stage_idx" ON "leads" ("stage");
CREATE INDEX IF NOT EXISTS "leads_created_at_idx" ON "leads" ("created_at");

CREATE TABLE IF NOT EXISTS "properties" (
  "property_id" text PRIMARY KEY,
  "created_at" timestamptz,
  "name" text,
  "type" text,
  "config" text,
  "area_name" text,
  "city" text,
  "price_min_inr" numeric,
  "price_max_inr" numeric,
  "size" numeric,
  "size_unit" text,
  "floor" text,
  "parking" text,
  "possession" text,
  "status" text,
  "tags" text,
  _seq bigserial
);
CREATE INDEX IF NOT EXISTS "properties_status_idx" ON "properties" ("status");
CREATE INDEX IF NOT EXISTS "properties_created_at_idx" ON "properties" ("created_at");

CREATE TABLE IF NOT EXISTS "brokers" (
  "broker_id" text PRIMARY KEY,
  "name" text,
  "phone" text,
  "email" text,
  "specialty" text,
  "area" text,
  "experience_years" numeric,
  "status" text,
  "joined_on" text,
  _seq bigserial
);
CREATE UNIQUE INDEX IF NOT EXISTS "brokers_name_uq" ON "brokers" ("name");
CREATE INDEX IF NOT EXISTS "brokers_status_idx" ON "brokers" ("status");

CREATE TABLE IF NOT EXISTS "bookings" (
  "booking_id" text PRIMARY KEY,
  "created_at" timestamptz,
  "lead_id" text,
  "client_name" text,
  "client_phone" text,
  "property_name" text,
  "broker" text,
  "visit_at" timestamptz,
  "budget_inr" numeric,
  "source" text,
  "created_by" text,
  "status" text,
  "deal_value_inr" numeric,
  "commission_inr" numeric,
  "cancel_reason" text,
  "notes" text,
  _seq bigserial
);
CREATE INDEX IF NOT EXISTS "bookings_status_idx" ON "bookings" ("status");
CREATE INDEX IF NOT EXISTS "bookings_created_at_idx" ON "bookings" ("created_at");

CREATE TABLE IF NOT EXISTS "messages" (
  "message_id" text PRIMARY KEY,
  "at" timestamptz,
  "lead_id" text,
  "lead_name" text,
  "phone" text,
  "broker" text,
  "channel" text,
  "direction" text,
  "sender" text,
  "text" text,
  "intent" text,
  "wa_message_id" text,
  _seq bigserial
);
CREATE INDEX IF NOT EXISTS "messages_at_idx" ON "messages" ("at");

CREATE TABLE IF NOT EXISTS "followups" (
  "followup_id" text PRIMARY KEY,
  "created_at" timestamptz,
  "lead_id" text,
  "lead_name" text,
  "phone" text,
  "broker" text,
  "reason" text,
  "property_interest" text,
  "count" numeric,
  "max_count" numeric,
  "next_due_at" timestamptz,
  "last_sent_at" timestamptz,
  "status" text,
  _seq bigserial
);
CREATE INDEX IF NOT EXISTS "followups_status_idx" ON "followups" ("status");
CREATE INDEX IF NOT EXISTS "followups_created_at_idx" ON "followups" ("created_at");

CREATE TABLE IF NOT EXISTS "calls" (
  "call_id" text PRIMARY KEY,
  "started_at" timestamptz,
  "lead_id" text,
  "caller_name" text,
  "phone" text,
  "broker" text,
  "vapi_call_id" text,
  "duration_sec" numeric,
  "outcome" text,
  "property_interest" text,
  "transcript" text,
  "recording_url" text,
  _seq bigserial
);
CREATE UNIQUE INDEX IF NOT EXISTS "calls_vapi_call_id_uq" ON "calls" ("vapi_call_id");
CREATE INDEX IF NOT EXISTS "calls_outcome_idx" ON "calls" ("outcome");
CREATE INDEX IF NOT EXISTS "calls_started_at_idx" ON "calls" ("started_at");

CREATE TABLE IF NOT EXISTS "agent_runs" (
  "run_id" text PRIMARY KEY,
  "at" timestamptz,
  "flow" text,
  "trigger" text,
  "lead_id" text,
  "status" text,
  "duration_ms" numeric,
  "detail" text,
  _seq bigserial
);
CREATE INDEX IF NOT EXISTS "agent_runs_status_idx" ON "agent_runs" ("status");
CREATE INDEX IF NOT EXISTS "agent_runs_at_idx" ON "agent_runs" ("at");

CREATE TABLE IF NOT EXISTS "agent_settings" (
  "key" text PRIMARY KEY,
  "value" text,
  "note" text,
  _seq bigserial
);

CREATE TABLE IF NOT EXISTS "audit_log" (
  "audit_id" text PRIMARY KEY,
  "at" timestamptz,
  "who" text,
  "flow" text,
  "action" text,
  "entity" text,
  "record_id" text,
  "summary" text,
  _seq bigserial
);
CREATE INDEX IF NOT EXISTS "audit_log_at_idx" ON "audit_log" ("at");

-- ── migrations: every ALTER below every CREATE (§5). A column added to os.yaml after go-live is added here on re-apply;
-- a renamed or removed column is a docs/migrations/<date>.md step (diff_os.py), never done silently.
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "created_at" timestamptz;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "source" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "stage" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "purpose" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "property_type" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "bhk" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "area_pref" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "budget_min_inr" numeric;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "budget_max_inr" numeric;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "property_interest" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "broker" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "ai_mode" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "lang" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "last_message" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "last_message_at" timestamptz;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "next_followup_at" timestamptz;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "followup_reason" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "lost_reason" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "summary" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "history" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS _seq bigserial;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid = '"leads"'::regclass AND left(conname, 17) = 'leads_source_v49_' AND conname <> 'leads_source_v49_249c3be1' LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'leads', r.conname); END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"leads"'::regclass AND conname = 'leads_source_v49_249c3be1') THEN
    ALTER TABLE "leads" ADD CONSTRAINT "leads_source_v49_249c3be1" CHECK (("source" IN ('WhatsApp', 'Voice', 'Walk-in', 'Referral') OR "source" = '')) NOT VALID; END IF;
END $$;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid = '"leads"'::regclass AND left(conname, 18) = 'leads_purpose_v49_' AND conname <> 'leads_purpose_v49_82155e0b' LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'leads', r.conname); END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"leads"'::regclass AND conname = 'leads_purpose_v49_82155e0b') THEN
    ALTER TABLE "leads" ADD CONSTRAINT "leads_purpose_v49_82155e0b" CHECK (("purpose" IN ('Buy', 'Rent', 'Invest') OR "purpose" = '')) NOT VALID; END IF;
END $$;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid = '"leads"'::regclass AND left(conname, 24) = 'leads_property_type_v49_' AND conname <> 'leads_property_type_v49_a3b003e7' LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'leads', r.conname); END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"leads"'::regclass AND conname = 'leads_property_type_v49_a3b003e7') THEN
    ALTER TABLE "leads" ADD CONSTRAINT "leads_property_type_v49_a3b003e7" CHECK (("property_type" IN ('Residential', 'Commercial', 'Plot') OR "property_type" = '')) NOT VALID; END IF;
END $$;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid = '"leads"'::regclass AND left(conname, 25) = 'leads_budget_min_inr_v49_' AND conname <> 'leads_budget_min_inr_v49_7282dcca' LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'leads', r.conname); END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"leads"'::regclass AND conname = 'leads_budget_min_inr_v49_7282dcca') THEN
    ALTER TABLE "leads" ADD CONSTRAINT "leads_budget_min_inr_v49_7282dcca" CHECK ("budget_min_inr" >= 0) NOT VALID; END IF;
END $$;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid = '"leads"'::regclass AND left(conname, 25) = 'leads_budget_max_inr_v49_' AND conname <> 'leads_budget_max_inr_v49_5fcac565' LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'leads', r.conname); END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"leads"'::regclass AND conname = 'leads_budget_max_inr_v49_5fcac565') THEN
    ALTER TABLE "leads" ADD CONSTRAINT "leads_budget_max_inr_v49_5fcac565" CHECK ("budget_max_inr" >= 0) NOT VALID; END IF;
END $$;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid = '"leads"'::regclass AND left(conname, 18) = 'leads_ai_mode_v49_' AND conname <> 'leads_ai_mode_v49_5caadd69' LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'leads', r.conname); END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"leads"'::regclass AND conname = 'leads_ai_mode_v49_5caadd69') THEN
    ALTER TABLE "leads" ADD CONSTRAINT "leads_ai_mode_v49_5caadd69" CHECK (("ai_mode" IN ('On', 'Off') OR "ai_mode" = '')) NOT VALID; END IF;
END $$;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid = '"leads"'::regclass AND left(conname, 15) = 'leads_lang_v49_' AND conname <> 'leads_lang_v49_8e9db479' LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'leads', r.conname); END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"leads"'::regclass AND conname = 'leads_lang_v49_8e9db479') THEN
    ALTER TABLE "leads" ADD CONSTRAINT "leads_lang_v49_8e9db479" CHECK (("lang" IN ('Hinglish', 'Hindi', 'English') OR "lang" = '')) NOT VALID; END IF;
END $$;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid = '"leads"'::regclass AND left(conname, 26) = 'leads_followup_reason_v49_' AND conname <> 'leads_followup_reason_v49_f3ff391f' LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'leads', r.conname); END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"leads"'::regclass AND conname = 'leads_followup_reason_v49_f3ff391f') THEN
    ALTER TABLE "leads" ADD CONSTRAINT "leads_followup_reason_v49_f3ff391f" CHECK (("followup_reason" IN ('Busy', 'No reply', 'Asked for later') OR "followup_reason" = '')) NOT VALID; END IF;
END $$;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "created_at" timestamptz;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "type" text;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "config" text;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "area_name" text;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "city" text;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "price_min_inr" numeric;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "price_max_inr" numeric;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "size" numeric;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "size_unit" text;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "floor" text;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "parking" text;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "possession" text;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "status" text;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "tags" text;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS _seq bigserial;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid = '"properties"'::regclass AND left(conname, 20) = 'properties_type_v49_' AND conname <> 'properties_type_v49_11d272e6' LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'properties', r.conname); END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"properties"'::regclass AND conname = 'properties_type_v49_11d272e6') THEN
    ALTER TABLE "properties" ADD CONSTRAINT "properties_type_v49_11d272e6" CHECK (("type" IN ('Residential', 'Commercial', 'Plot') OR "type" = '')) NOT VALID; END IF;
END $$;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid = '"properties"'::regclass AND left(conname, 22) = 'properties_config_v49_' AND conname <> 'properties_config_v49_afe2b210' LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'properties', r.conname); END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"properties"'::regclass AND conname = 'properties_config_v49_afe2b210') THEN
    ALTER TABLE "properties" ADD CONSTRAINT "properties_config_v49_afe2b210" CHECK (("config" IN ('1 BHK', '2 BHK', '3 BHK', '4 BHK', 'Shop', 'Office', 'Plot', 'Land') OR "config" = '')) NOT VALID; END IF;
END $$;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid = '"properties"'::regclass AND left(conname, 29) = 'properties_price_min_inr_v49_' AND conname <> 'properties_price_min_inr_v49_67d74427' LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'properties', r.conname); END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"properties"'::regclass AND conname = 'properties_price_min_inr_v49_67d74427') THEN
    ALTER TABLE "properties" ADD CONSTRAINT "properties_price_min_inr_v49_67d74427" CHECK ("price_min_inr" > 0) NOT VALID; END IF;
END $$;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid = '"properties"'::regclass AND left(conname, 29) = 'properties_price_max_inr_v49_' AND conname <> 'properties_price_max_inr_v49_b9c8f290' LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'properties', r.conname); END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"properties"'::regclass AND conname = 'properties_price_max_inr_v49_b9c8f290') THEN
    ALTER TABLE "properties" ADD CONSTRAINT "properties_price_max_inr_v49_b9c8f290" CHECK ("price_max_inr" > 0) NOT VALID; END IF;
END $$;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid = '"properties"'::regclass AND left(conname, 20) = 'properties_size_v49_' AND conname <> 'properties_size_v49_353c4f4a' LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'properties', r.conname); END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"properties"'::regclass AND conname = 'properties_size_v49_353c4f4a') THEN
    ALTER TABLE "properties" ADD CONSTRAINT "properties_size_v49_353c4f4a" CHECK ("size" > 0) NOT VALID; END IF;
END $$;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid = '"properties"'::regclass AND left(conname, 25) = 'properties_size_unit_v49_' AND conname <> 'properties_size_unit_v49_78a3e380' LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'properties', r.conname); END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"properties"'::regclass AND conname = 'properties_size_unit_v49_78a3e380') THEN
    ALTER TABLE "properties" ADD CONSTRAINT "properties_size_unit_v49_78a3e380" CHECK (("size_unit" IN ('sq.ft', 'sq.yd', 'acre') OR "size_unit" = '')) NOT VALID; END IF;
END $$;
ALTER TABLE "brokers" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "brokers" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE "brokers" ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE "brokers" ADD COLUMN IF NOT EXISTS "specialty" text;
ALTER TABLE "brokers" ADD COLUMN IF NOT EXISTS "area" text;
ALTER TABLE "brokers" ADD COLUMN IF NOT EXISTS "experience_years" numeric;
ALTER TABLE "brokers" ADD COLUMN IF NOT EXISTS "status" text;
ALTER TABLE "brokers" ADD COLUMN IF NOT EXISTS "joined_on" text;
ALTER TABLE "brokers" ADD COLUMN IF NOT EXISTS _seq bigserial;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid = '"brokers"'::regclass AND left(conname, 22) = 'brokers_specialty_v49_' AND conname <> 'brokers_specialty_v49_3b7d6dc8' LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'brokers', r.conname); END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"brokers"'::regclass AND conname = 'brokers_specialty_v49_3b7d6dc8') THEN
    ALTER TABLE "brokers" ADD CONSTRAINT "brokers_specialty_v49_3b7d6dc8" CHECK (("specialty" IN ('Residential', 'Commercial', 'Plots') OR "specialty" = '')) NOT VALID; END IF;
END $$;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid = '"brokers"'::regclass AND left(conname, 29) = 'brokers_experience_years_v49_' AND conname <> 'brokers_experience_years_v49_f7d27287' LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'brokers', r.conname); END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"brokers"'::regclass AND conname = 'brokers_experience_years_v49_f7d27287') THEN
    ALTER TABLE "brokers" ADD CONSTRAINT "brokers_experience_years_v49_f7d27287" CHECK ("experience_years" >= 0 AND "experience_years" <= 60) NOT VALID; END IF;
END $$;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "created_at" timestamptz;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "lead_id" text;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "client_name" text;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "client_phone" text;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "property_name" text;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "broker" text;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "visit_at" timestamptz;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "budget_inr" numeric;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "source" text;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "created_by" text;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "status" text;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "deal_value_inr" numeric;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "commission_inr" numeric;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "cancel_reason" text;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS _seq bigserial;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid = '"bookings"'::regclass AND left(conname, 24) = 'bookings_budget_inr_v49_' AND conname <> 'bookings_budget_inr_v49_9334e4e8' LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'bookings', r.conname); END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"bookings"'::regclass AND conname = 'bookings_budget_inr_v49_9334e4e8') THEN
    ALTER TABLE "bookings" ADD CONSTRAINT "bookings_budget_inr_v49_9334e4e8" CHECK ("budget_inr" >= 0) NOT VALID; END IF;
END $$;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid = '"bookings"'::regclass AND left(conname, 20) = 'bookings_source_v49_' AND conname <> 'bookings_source_v49_249c3be1' LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'bookings', r.conname); END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"bookings"'::regclass AND conname = 'bookings_source_v49_249c3be1') THEN
    ALTER TABLE "bookings" ADD CONSTRAINT "bookings_source_v49_249c3be1" CHECK (("source" IN ('WhatsApp', 'Voice', 'Walk-in', 'Referral') OR "source" = '')) NOT VALID; END IF;
END $$;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid = '"bookings"'::regclass AND left(conname, 24) = 'bookings_created_by_v49_' AND conname <> 'bookings_created_by_v49_8fb6e9a4' LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'bookings', r.conname); END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"bookings"'::regclass AND conname = 'bookings_created_by_v49_8fb6e9a4') THEN
    ALTER TABLE "bookings" ADD CONSTRAINT "bookings_created_by_v49_8fb6e9a4" CHECK (("created_by" IN ('AI agent', 'Office') OR "created_by" = '')) NOT VALID; END IF;
END $$;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid = '"bookings"'::regclass AND left(conname, 28) = 'bookings_deal_value_inr_v49_' AND conname <> 'bookings_deal_value_inr_v49_258487c7' LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'bookings', r.conname); END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"bookings"'::regclass AND conname = 'bookings_deal_value_inr_v49_258487c7') THEN
    ALTER TABLE "bookings" ADD CONSTRAINT "bookings_deal_value_inr_v49_258487c7" CHECK ("deal_value_inr" > 0) NOT VALID; END IF;
END $$;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid = '"bookings"'::regclass AND left(conname, 28) = 'bookings_commission_inr_v49_' AND conname <> 'bookings_commission_inr_v49_7ec5bed8' LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'bookings', r.conname); END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"bookings"'::regclass AND conname = 'bookings_commission_inr_v49_7ec5bed8') THEN
    ALTER TABLE "bookings" ADD CONSTRAINT "bookings_commission_inr_v49_7ec5bed8" CHECK ("commission_inr" >= 0) NOT VALID; END IF;
END $$;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "at" timestamptz;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "lead_id" text;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "lead_name" text;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "broker" text;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "channel" text;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "direction" text;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "sender" text;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "text" text;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "intent" text;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "wa_message_id" text;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS _seq bigserial;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid = '"messages"'::regclass AND left(conname, 21) = 'messages_channel_v49_' AND conname <> 'messages_channel_v49_681db0c2' LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'messages', r.conname); END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"messages"'::regclass AND conname = 'messages_channel_v49_681db0c2') THEN
    ALTER TABLE "messages" ADD CONSTRAINT "messages_channel_v49_681db0c2" CHECK (("channel" IN ('WhatsApp', 'Voice') OR "channel" = '')) NOT VALID; END IF;
END $$;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid = '"messages"'::regclass AND left(conname, 23) = 'messages_direction_v49_' AND conname <> 'messages_direction_v49_fa39d375' LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'messages', r.conname); END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"messages"'::regclass AND conname = 'messages_direction_v49_fa39d375') THEN
    ALTER TABLE "messages" ADD CONSTRAINT "messages_direction_v49_fa39d375" CHECK (("direction" IN ('In', 'Out') OR "direction" = '')) NOT VALID; END IF;
END $$;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid = '"messages"'::regclass AND left(conname, 20) = 'messages_sender_v49_' AND conname <> 'messages_sender_v49_e0bc69a9' LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'messages', r.conname); END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"messages"'::regclass AND conname = 'messages_sender_v49_e0bc69a9') THEN
    ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_v49_e0bc69a9" CHECK (("sender" IN ('Client', 'AI agent', 'Office') OR "sender" = '')) NOT VALID; END IF;
END $$;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid = '"messages"'::regclass AND left(conname, 20) = 'messages_intent_v49_' AND conname <> 'messages_intent_v49_b28fb336' LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'messages', r.conname); END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"messages"'::regclass AND conname = 'messages_intent_v49_b28fb336') THEN
    ALTER TABLE "messages" ADD CONSTRAINT "messages_intent_v49_b28fb336" CHECK (("intent" IN ('ask', 'book_visit', 'later', 'not_interested', 'other') OR "intent" = '')) NOT VALID; END IF;
END $$;
ALTER TABLE "followups" ADD COLUMN IF NOT EXISTS "created_at" timestamptz;
ALTER TABLE "followups" ADD COLUMN IF NOT EXISTS "lead_id" text;
ALTER TABLE "followups" ADD COLUMN IF NOT EXISTS "lead_name" text;
ALTER TABLE "followups" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE "followups" ADD COLUMN IF NOT EXISTS "broker" text;
ALTER TABLE "followups" ADD COLUMN IF NOT EXISTS "reason" text;
ALTER TABLE "followups" ADD COLUMN IF NOT EXISTS "property_interest" text;
ALTER TABLE "followups" ADD COLUMN IF NOT EXISTS "count" numeric;
ALTER TABLE "followups" ADD COLUMN IF NOT EXISTS "max_count" numeric;
ALTER TABLE "followups" ADD COLUMN IF NOT EXISTS "next_due_at" timestamptz;
ALTER TABLE "followups" ADD COLUMN IF NOT EXISTS "last_sent_at" timestamptz;
ALTER TABLE "followups" ADD COLUMN IF NOT EXISTS "status" text;
ALTER TABLE "followups" ADD COLUMN IF NOT EXISTS _seq bigserial;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid = '"followups"'::regclass AND left(conname, 21) = 'followups_reason_v49_' AND conname <> 'followups_reason_v49_e6887f42' LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'followups', r.conname); END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"followups"'::regclass AND conname = 'followups_reason_v49_e6887f42') THEN
    ALTER TABLE "followups" ADD CONSTRAINT "followups_reason_v49_e6887f42" CHECK (("reason" IN ('Busy', 'No reply', 'Asked for later') OR "reason" = '')) NOT VALID; END IF;
END $$;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid = '"followups"'::regclass AND left(conname, 20) = 'followups_count_v49_' AND conname <> 'followups_count_v49_ccd70c0f' LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'followups', r.conname); END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"followups"'::regclass AND conname = 'followups_count_v49_ccd70c0f') THEN
    ALTER TABLE "followups" ADD CONSTRAINT "followups_count_v49_ccd70c0f" CHECK ("count" >= 0 AND "count" <= 10) NOT VALID; END IF;
END $$;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid = '"followups"'::regclass AND left(conname, 24) = 'followups_max_count_v49_' AND conname <> 'followups_max_count_v49_907f27e2' LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'followups', r.conname); END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"followups"'::regclass AND conname = 'followups_max_count_v49_907f27e2') THEN
    ALTER TABLE "followups" ADD CONSTRAINT "followups_max_count_v49_907f27e2" CHECK ("max_count" >= 1 AND "max_count" <= 10) NOT VALID; END IF;
END $$;
ALTER TABLE "calls" ADD COLUMN IF NOT EXISTS "started_at" timestamptz;
ALTER TABLE "calls" ADD COLUMN IF NOT EXISTS "lead_id" text;
ALTER TABLE "calls" ADD COLUMN IF NOT EXISTS "caller_name" text;
ALTER TABLE "calls" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE "calls" ADD COLUMN IF NOT EXISTS "broker" text;
ALTER TABLE "calls" ADD COLUMN IF NOT EXISTS "vapi_call_id" text;
ALTER TABLE "calls" ADD COLUMN IF NOT EXISTS "duration_sec" numeric;
ALTER TABLE "calls" ADD COLUMN IF NOT EXISTS "outcome" text;
ALTER TABLE "calls" ADD COLUMN IF NOT EXISTS "property_interest" text;
ALTER TABLE "calls" ADD COLUMN IF NOT EXISTS "transcript" text;
ALTER TABLE "calls" ADD COLUMN IF NOT EXISTS "recording_url" text;
ALTER TABLE "calls" ADD COLUMN IF NOT EXISTS _seq bigserial;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid = '"calls"'::regclass AND left(conname, 23) = 'calls_duration_sec_v49_' AND conname <> 'calls_duration_sec_v49_ce554b78' LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'calls', r.conname); END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"calls"'::regclass AND conname = 'calls_duration_sec_v49_ce554b78') THEN
    ALTER TABLE "calls" ADD CONSTRAINT "calls_duration_sec_v49_ce554b78" CHECK ("duration_sec" >= 0) NOT VALID; END IF;
END $$;
ALTER TABLE "agent_runs" ADD COLUMN IF NOT EXISTS "at" timestamptz;
ALTER TABLE "agent_runs" ADD COLUMN IF NOT EXISTS "flow" text;
ALTER TABLE "agent_runs" ADD COLUMN IF NOT EXISTS "trigger" text;
ALTER TABLE "agent_runs" ADD COLUMN IF NOT EXISTS "lead_id" text;
ALTER TABLE "agent_runs" ADD COLUMN IF NOT EXISTS "status" text;
ALTER TABLE "agent_runs" ADD COLUMN IF NOT EXISTS "duration_ms" numeric;
ALTER TABLE "agent_runs" ADD COLUMN IF NOT EXISTS "detail" text;
ALTER TABLE "agent_runs" ADD COLUMN IF NOT EXISTS _seq bigserial;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid = '"agent_runs"'::regclass AND left(conname, 20) = 'agent_runs_flow_v49_' AND conname <> 'agent_runs_flow_v49_a77b752d' LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'agent_runs', r.conname); END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"agent_runs"'::regclass AND conname = 'agent_runs_flow_v49_a77b752d') THEN
    ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_flow_v49_a77b752d" CHECK (("flow" IN ('WA_AGENT', 'VOICE_AGENT', 'FOLLOWUP_RUN') OR "flow" = '')) NOT VALID; END IF;
END $$;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid = '"agent_runs"'::regclass AND left(conname, 27) = 'agent_runs_duration_ms_v49_' AND conname <> 'agent_runs_duration_ms_v49_50beebd6' LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'agent_runs', r.conname); END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"agent_runs"'::regclass AND conname = 'agent_runs_duration_ms_v49_50beebd6') THEN
    ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_duration_ms_v49_50beebd6" CHECK ("duration_ms" >= 0) NOT VALID; END IF;
END $$;
ALTER TABLE "agent_settings" ADD COLUMN IF NOT EXISTS "value" text;
ALTER TABLE "agent_settings" ADD COLUMN IF NOT EXISTS "note" text;
ALTER TABLE "agent_settings" ADD COLUMN IF NOT EXISTS _seq bigserial;
ALTER TABLE "audit_log" ADD COLUMN IF NOT EXISTS "at" timestamptz;
ALTER TABLE "audit_log" ADD COLUMN IF NOT EXISTS "who" text;
ALTER TABLE "audit_log" ADD COLUMN IF NOT EXISTS "flow" text;
ALTER TABLE "audit_log" ADD COLUMN IF NOT EXISTS "action" text;
ALTER TABLE "audit_log" ADD COLUMN IF NOT EXISTS "entity" text;
ALTER TABLE "audit_log" ADD COLUMN IF NOT EXISTS "record_id" text;
ALTER TABLE "audit_log" ADD COLUMN IF NOT EXISTS "summary" text;
ALTER TABLE "audit_log" ADD COLUMN IF NOT EXISTS _seq bigserial;

-- ── v5.1 built-in roles (os.yaml roles[]): inserted when missing and not deleted by an administrator (app_settings
-- deleted_role:<key>), never overwritten — the Users & roles page edits them
INSERT INTO app_roles (key, label, description, base_role, pages, built_in) SELECT 'admin', 'Office admin', 'Runs the desk: inbox, leads, site visits, inventory, brokers and the AI agent', 'admin', '{"*": "edit"}'::jsonb, true WHERE NOT EXISTS (SELECT 1 FROM app_settings WHERE key = 'deleted_role:admin') ON CONFLICT (key) DO NOTHING;
INSERT INTO app_roles (key, label, description, base_role, pages, built_in) SELECT 'broker', 'Broker', 'Works the site visits and leads assigned to them', 'broker', '{"my_visits": "edit", "my_leads": "edit", "my_followups": "edit", "settings": "edit"}'::jsonb, true WHERE NOT EXISTS (SELECT 1 FROM app_settings WHERE key = 'deleted_role:broker') ON CONFLICT (key) DO NOTHING;

-- ── v5.1 temporary administrator: only on a database that has NEVER had an administrator (no role = 'admin' row at all)
DO $pucho_admin$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin') THEN
    INSERT INTO users (id, email, name, role, password_hash, must_change_password, must_change_email)
    VALUES ('USR-TEMP-ADMIN', 'admin@pucho.ai', 'Temporary administrator', 'admin', '$argon2id$v=19$m=19456,t=2,p=1$FYacKA5TRCvPnHuDBocMtw$qaGjWVON05qvdIy7B+wpTE7WteZ+KbzUYqUQC8Aoiyc', true, true) ON CONFLICT DO NOTHING;
  END IF;
  -- a real administrator has finished its setup: the pending temporary admin is retired on every apply (never claimable later)
  UPDATE users SET is_active = false, deactivated_at = now(), deactivated_by = 'schema.sql', updated_at = now()
   WHERE email = 'admin@pucho.ai' AND must_change_email AND is_active
     AND EXISTS (SELECT 1 FROM users a WHERE a.role = 'admin' AND a.is_active AND NOT a.must_change_email AND a.email <> 'admin@pucho.ai');
END $pucho_admin$;
