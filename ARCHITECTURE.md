# FertiFind application

The current deployment target is **Netlify Free + Neon Free**. See [DEPLOYMENT.md](DEPLOYMENT.md) for the serverless API, database setup and free-tier deployment path. AWS below is a future growth option.

The legacy static site remains available while `apps/web` (Next.js App Router, React, TypeScript, Tailwind) and `apps/api` (NestJS) replace its directory discovery flow. The new site includes landing, search/filter/pagination, and provider profiles. PostgreSQL is the source of truth; PostGIS supports radius queries. Redis caches directory results for 60 seconds. Listings are imported as unverified, without ratings or verification claims from the legacy dataset.

## Local development

1. `npm install`
2. Copy `.env.example` to `.env`; set random passwords and matching DATABASE_URL. Keep passwords URL-safe or percent-encode them in DATABASE_URL.
3. `docker compose up -d db redis typesense`
4. Load environment variables into your shell. Node supports `--env-file`; npm scripts otherwise inherit the shell environment. For PowerShell: `Get-Content .env | Where-Object { $_ -match '^[A-Z_]+=' } | ForEach-Object { $parts = $_ -split '=',2; [Environment]::SetEnvironmentVariable($parts[0],$parts[1],'Process') }`.
5. `npm run seed` then `npm run dev:api`; in a second terminal with the environment loaded, `npm run dev:web`.
6. Open http://localhost:3000. API readiness: http://localhost:4000/v1/health.

`npm run typecheck` and `npm run build` verify both applications. After building, `npm test` verifies API validation and safe database outage responses. `docker compose up --build` runs both applications with the infrastructure. Database initialization only runs on the first creation of its volume; introduce versioned migrations before future schema changes. Do not delete database volumes to upgrade production.

## API

`GET /v1/providers?q=IVF&kind=clinic&area=Jumeirah&page=1&limit=12` returns items, total, page and limit. Optional `lat`, `lng`, and `radius` (kilometres, maximum 100) use PostGIS; imported records have no invented coordinates and will not appear in radius results until geocoded. `GET /v1/providers/:slug` returns a published listing or 404. All SQL values are parameterized. No public write endpoints are enabled.

## Search and growth

`npm run index:search` upserts published records into Typesense in batches. When TYPESENSE_API_KEY is configured, text searches use Typesense typo tolerance and hydrate current published records from PostgreSQL. Area and radius filters use PostgreSQL full-text/PostGIS queries. Unavailable or empty search indexes fall back to PostgreSQL. Add index deletion reconciliation and a transactional outbox worker before enabling management writes. Redis failures fall back to the database. PostgreSQL failures return 503. Separate web and API processes can be replicated; budget connection pools across replicas. Cache expiry bounds listing staleness.

## Production integrations still required

- AWS: provision ECS/Fargate, ALB, managed PostgreSQL with PostGIS, ElastiCache and private Typesense service. Use Secrets Manager, TLS, backups, restore drills, and health-based rollout. Docker Compose is for local development.
- Cloudflare: configure DNS, CDN/WAF and rate limits at the edge. Cache public content only; bypass any future authenticated routes.
- S3/R2: add private buckets and signed uploads behind authenticated, authorized management APIs; validate file size/type and scan uploads before publishing.
- Authentication and workflows: migrate doctor/clinic ownership, admin moderation, claims, appointment requests and reviews behind role/ownership checks. Existing static dashboards are not wired into this API.
- Analytics: integrate GA4, Search Console and PostHog with consent and event allowlists; keep patient details and sensitive search strings out of analytics.
- Sentry: configure server and client SDKs with PII scrubbing and secrets supplied at deploy time.

These services require accounts, credentials and deployment configuration. They are not provisioned by this repository. Existing provider records need source verification and licensing review before publication. Run the new application locally for review before switching the live domain from static hosting.
