CREATE EXTENSION IF NOT EXISTS postgis;
CREATE OR REPLACE FUNCTION array_to_string_immutable(text[]) RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$ SELECT array_to_string($1, ' ') $$;
CREATE TABLE IF NOT EXISTS providers (
 id text PRIMARY KEY, slug text UNIQUE NOT NULL, name text NOT NULL,
 kind text NOT NULL CHECK (kind IN ('doctor','clinic')), specialty text NOT NULL DEFAULT '',
 area text NOT NULL DEFAULT '', address text NOT NULL DEFAULT '', services text[] NOT NULL DEFAULT '{}',
 phone text NOT NULL DEFAULT '', website text NOT NULL DEFAULT '', verified boolean NOT NULL DEFAULT false,
 published boolean NOT NULL DEFAULT true, location geography(Point,4326),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english',name || ' ' || specialty || ' ' || area || ' ' || array_to_string_immutable(services))) STORED
);
CREATE INDEX IF NOT EXISTS providers_search ON providers USING gin(search_vector);
CREATE INDEX IF NOT EXISTS providers_location ON providers USING gist(location);
CREATE INDEX IF NOT EXISTS providers_kind_area ON providers(kind,area) WHERE published;
