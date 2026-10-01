BEGIN;
ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_role_check;
ALTER TABLE app_users ADD CONSTRAINT app_users_role_check CHECK(role IN ('patient','doctor','clinic','hospital','lab','surgeon','technician','admin'));
ALTER TABLE providers ADD COLUMN IF NOT EXISTS details jsonb NOT NULL DEFAULT '{}';
CREATE TABLE IF NOT EXISTS provider_affiliations (
 provider_id text NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
 facility_id text NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
 PRIMARY KEY(provider_id,facility_id), CHECK(provider_id<>facility_id)
);
CREATE TABLE IF NOT EXISTS site_settings (
 id text PRIMARY KEY DEFAULT 'site', data jsonb NOT NULL DEFAULT '{}', updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO site_settings(id) VALUES('site') ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS dashboard_appointments (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL REFERENCES app_users(id), data jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), archived boolean NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS dashboard_reviews (LIKE dashboard_appointments INCLUDING ALL);
CREATE TABLE IF NOT EXISTS dashboard_payments (LIKE dashboard_appointments INCLUDING ALL);
CREATE TABLE IF NOT EXISTS dashboard_articles (LIKE dashboard_appointments INCLUDING ALL);
CREATE TABLE IF NOT EXISTS dashboard_admissions (LIKE dashboard_appointments INCLUDING ALL);
CREATE TABLE IF NOT EXISTS dashboard_notes (LIKE dashboard_appointments INCLUDING ALL);
CREATE TABLE IF NOT EXISTS dashboard_prescriptions (LIKE dashboard_appointments INCLUDING ALL);
CREATE TABLE IF NOT EXISTS dashboard_lab_requests (LIKE dashboard_appointments INCLUDING ALL);
CREATE TABLE IF NOT EXISTS dashboard_documents (LIKE dashboard_appointments INCLUDING ALL);
CREATE TABLE IF NOT EXISTS dashboard_tariffs (LIKE dashboard_appointments INCLUDING ALL);
CREATE TABLE IF NOT EXISTS dashboard_schedules (LIKE dashboard_appointments INCLUDING ALL);
CREATE TABLE IF NOT EXISTS dashboard_saved_providers (LIKE dashboard_appointments INCLUDING ALL);
CREATE TABLE IF NOT EXISTS dashboard_patients (LIKE dashboard_appointments INCLUDING ALL);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['appointments','reviews','payments','articles','admissions','notes','prescriptions','lab_requests','documents','tariffs','schedules','saved_providers','patients'] LOOP
  EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(owner_id,updated_at DESC)', 'dashboard_'||t||'_owner', 'dashboard_'||t);
 END LOOP;
END $$;
CREATE TABLE IF NOT EXISTS account_files (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL REFERENCES app_users(id), name text NOT NULL,
 content_type text NOT NULL, content bytea NOT NULL CHECK(octet_length(content)<=1048576), created_at timestamptz NOT NULL DEFAULT now()
);
COMMIT;
