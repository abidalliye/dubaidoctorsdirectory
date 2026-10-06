BEGIN;
ALTER TABLE provider_memberships ADD COLUMN IF NOT EXISTS permission text NOT NULL DEFAULT 'owner';
CREATE TABLE IF NOT EXISTS care_provider_hours (
 id uuid PRIMARY KEY, provider_id text NOT NULL REFERENCES providers(id), weekday integer NOT NULL CHECK(weekday BETWEEN 0 AND 6),
 opens time NOT NULL, closes time NOT NULL CHECK(closes>opens), UNIQUE(provider_id,weekday,opens,closes)
);
CREATE TABLE IF NOT EXISTS care_licenses (
 id uuid PRIMARY KEY, provider_id text NOT NULL REFERENCES providers(id), authority text NOT NULL, license_number text NOT NULL,
 expires_on date, qualification text NOT NULL DEFAULT '', proof_file_id uuid REFERENCES account_files(id)
);
CREATE TABLE IF NOT EXISTS care_branches (
 id uuid PRIMARY KEY, provider_id text NOT NULL REFERENCES providers(id), name text NOT NULL, country text NOT NULL DEFAULT 'UAE',
 city text NOT NULL, address text NOT NULL, latitude numeric CHECK(latitude BETWEEN -90 AND 90), longitude numeric CHECK(longitude BETWEEN -180 AND 180), phone text NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS care_media (
 id uuid PRIMARY KEY, provider_id text NOT NULL REFERENCES providers(id), caption text NOT NULL DEFAULT '', content_type text NOT NULL,
 content bytea NOT NULL CHECK(octet_length(content)<=1048576), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS care_provider_hours_provider ON care_provider_hours(provider_id);
CREATE INDEX IF NOT EXISTS care_licenses_provider ON care_licenses(provider_id);
CREATE INDEX IF NOT EXISTS care_branches_provider ON care_branches(provider_id);
CREATE INDEX IF NOT EXISTS care_media_provider ON care_media(provider_id);
COMMIT;
