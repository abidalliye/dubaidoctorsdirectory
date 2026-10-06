BEGIN;
CREATE TABLE IF NOT EXISTS care_dependents (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL REFERENCES app_users(id), name text NOT NULL,
 birth_date date, relationship text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS care_services (
 id uuid PRIMARY KEY, provider_id text NOT NULL REFERENCES providers(id), name text NOT NULL,
 description text NOT NULL DEFAULT '', price_minor integer NOT NULL CHECK(price_minor>=0),
 duration_minutes integer NOT NULL CHECK(duration_minutes BETWEEN 5 AND 480),
 mode text NOT NULL CHECK(mode IN ('In clinic','Home visit','Video')), preparation text NOT NULL DEFAULT '',
 active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS care_slots (
 id uuid PRIMARY KEY, service_id uuid NOT NULL REFERENCES care_services(id),
 starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL CHECK(ends_at>starts_at),
 active boolean NOT NULL DEFAULT true, UNIQUE(service_id,starts_at)
);
CREATE TABLE IF NOT EXISTS care_appointments (
 id uuid PRIMARY KEY, patient_id uuid NOT NULL REFERENCES app_users(id), dependent_id uuid REFERENCES care_dependents(id),
 slot_id uuid NOT NULL REFERENCES care_slots(id), provider_id text NOT NULL REFERENCES providers(id),
 service_id uuid NOT NULL REFERENCES care_services(id), reason text NOT NULL DEFAULT '',
 insurance text NOT NULL DEFAULT '', patient_name text NOT NULL, phone text NOT NULL DEFAULT '',
 status text NOT NULL DEFAULT 'Requested' CHECK(status IN ('Requested','Confirmed','Completed','Cancelled','Rejected')),
 price_minor integer NOT NULL CHECK(price_minor>=0), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS care_slot_reserved ON care_appointments(slot_id) WHERE status IN ('Requested','Confirmed','Completed');
CREATE INDEX IF NOT EXISTS care_appointment_patient ON care_appointments(patient_id,created_at DESC);
CREATE INDEX IF NOT EXISTS care_appointment_provider ON care_appointments(provider_id,created_at DESC);
CREATE TABLE IF NOT EXISTS care_history (
 id bigserial PRIMARY KEY, appointment_id uuid NOT NULL REFERENCES care_appointments(id),
 actor_id uuid NOT NULL REFERENCES app_users(id), status text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS care_notifications (
 id uuid PRIMARY KEY, recipient_id uuid NOT NULL REFERENCES app_users(id), title text NOT NULL,
 appointment_id uuid REFERENCES care_appointments(id), read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS care_notifications_recipient ON care_notifications(recipient_id,created_at DESC);
CREATE TABLE IF NOT EXISTS care_records (
 id uuid PRIMARY KEY, appointment_id uuid NOT NULL REFERENCES care_appointments(id), author_id uuid NOT NULL REFERENCES app_users(id),
 kind text NOT NULL CHECK(kind IN ('note','prescription','lab_order','report','message')),
 title text NOT NULL, body text NOT NULL, lab_provider_id text REFERENCES providers(id), file_id uuid REFERENCES account_files(id),
 status text NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft','Released','Requested','Accepted','Collected','Processing','Completed')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS care_invoices (
 id uuid PRIMARY KEY, appointment_id uuid UNIQUE NOT NULL REFERENCES care_appointments(id),
 amount_minor integer NOT NULL CHECK(amount_minor>=0), currency text NOT NULL DEFAULT 'AED',
 status text NOT NULL DEFAULT 'Issued' CHECK(status IN ('Issued','Paid','Cancelled')),
 payment_method text NOT NULL DEFAULT '', paid_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS care_reviews (
 id uuid PRIMARY KEY, appointment_id uuid UNIQUE NOT NULL REFERENCES care_appointments(id), patient_id uuid NOT NULL REFERENCES app_users(id),
 provider_id text NOT NULL REFERENCES providers(id), rating integer NOT NULL CHECK(rating BETWEEN 1 AND 5),
 comment text NOT NULL, status text NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Published','Hidden')), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS care_favorites (
 user_id uuid NOT NULL REFERENCES app_users(id), provider_id text NOT NULL REFERENCES providers(id),
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,provider_id)
);
CREATE TABLE IF NOT EXISTS care_claims (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES app_users(id), provider_id text NOT NULL REFERENCES providers(id),
 evidence text NOT NULL, status text NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Approved','Rejected')),
 created_at timestamptz NOT NULL DEFAULT now(), reviewed_by uuid REFERENCES app_users(id)
);
COMMIT;
