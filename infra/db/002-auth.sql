BEGIN;
ALTER TABLE providers DROP CONSTRAINT IF EXISTS providers_kind_check;
ALTER TABLE providers ADD CONSTRAINT providers_kind_check CHECK(kind IN ('doctor','clinic','hospital','lab','surgeon','technician'));
CREATE TABLE IF NOT EXISTS app_users (
 id uuid PRIMARY KEY, email text UNIQUE NOT NULL, password_hash text NOT NULL,
 name text NOT NULL, phone text NOT NULL DEFAULT '',
 role text NOT NULL CHECK(role IN ('patient','doctor','clinic','hospital','lab','surgeon','technician','admin')),
 status text NOT NULL CHECK(status IN ('active','pending','disabled')),
 email_verified boolean NOT NULL DEFAULT false,
 profile jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS app_sessions (
 token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
 csrf_hash text NOT NULL, expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS app_sessions_user ON app_sessions(user_id);
CREATE INDEX IF NOT EXISTS app_sessions_expiry ON app_sessions(expires_at);
CREATE TABLE IF NOT EXISTS auth_limits (
 key text PRIMARY KEY, attempts integer NOT NULL, expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS account_tokens (
 token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
 purpose text NOT NULL CHECK(purpose IN ('reset','verify')), expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS provider_memberships (
 provider_id text NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
 PRIMARY KEY(provider_id,user_id)
);
CREATE TABLE IF NOT EXISTS account_audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 actor_id uuid REFERENCES app_users(id), action text NOT NULL,
 target_id text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
COMMIT;
