# Free initial deployment: Netlify + Neon

## Current deployment

- Site: https://fertifind-dubai.netlify.app
- GitHub deployment branch: `codex/netlify-launch`.
- Neon project: `fertifind-directory` (`delicate-hall-44906306`), production branch `br-shiny-flower-b4i59u41`.
- The initial schema and 12 legacy provider listings have been imported. All listings are unverified.
- The database connection is stored as a Netlify secret, not in this repository.

Use Netlify Free for the original HTML frontend and the NestJS API in Netlify Functions, plus Neon Free for PostgreSQL/PostGIS. No AWS account, always-running server, Redis instance or Typesense subscription is required for the initial directory. Existing Redis/Typesense and Docker support remain optional paths for growth.

Netlify supports Next.js SSR/App Router through its automatic adapter: https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/
Free hosting has usage allowances and can pause when exhausted: https://www.netlify.com/pricing/
Neon offers a free plan with database storage/compute limits: https://neon.com/blog/neon-backend-is-ga
PostGIS is supported by Neon: https://neon.com/blog/ten-most-popular-postgres-extensions

## 1. Create the database

Create a Neon Free project. Copy its pooled PostgreSQL connection string including `sslmode=require`. Keep that connection string private. Set it as `DATABASE_URL` in your terminal and run:

```powershell
npm ci
# Set DATABASE_URL privately in your terminal/session; do not commit it.
npm run db:init
npm run seed
```

`db:init` enables PostGIS and creates the initial schema/indexes. It does not drop existing tables. `seed` imports only public doctor/clinic listing JSONs and preserves existing records. Patient, appointment and user files are not imported. Listing data is unverified.

For future schema changes, use versioned migrations. Do not treat `db:init` as a schema upgrade system.

## 2. Connect the repository to Netlify

Import the Git repository in Netlify. Select the Free plan. Keep the base directory at repository root, leave the package directory empty and remove the Next.js runtime. The root `netlify.toml` specifies:

- Build command: `npm run build:site` (compiles NestJS and copies original public website assets).
- Publish directory: `dist/site`.
- Functions directory: `netlify/functions`.
- Node version: 22.
- API rewrite: `/v1/*` to the NestJS serverless function.

The published frontend is the original multi-page HTML site; do not select `apps/web`, install the Next.js runtime or add an SPA catch-all redirect. Only allowlisted website assets and public directory data are published. Private fixture JSON files are excluded.

## 3. Set runtime environment variables

Add `DATABASE_URL` and `DB_POOL_SIZE=2` in Netlify's environment-variable settings, available to Functions/runtime. Use the pooled Neon URL. Never prefix database credentials with `NEXT_PUBLIC_`.

Leave `API_URL` unset. The directory calls `/v1/providers` on the same origin. `WEB_ORIGIN` is configured in netlify.toml for authentication origin checks. Real accounts and profile edits use Neon after applying migration 002. See [AUTHENTICATION.md](AUTHENTICATION.md) for first-admin provisioning and optional email delivery configuration.

Leave `REDIS_URL` and `TYPESENSE_API_KEY` unset for the initial free setup. PostgreSQL handles search and geo queries. Do not copy local Docker secrets or localhost database URLs into Netlify.

Use a separate Neon branch/database for deploy previews if previews will later support writes. Current public API routes are read-only.

## 4. Deploy and verify

Deploy from Netlify, then check `/`, `/directory`, one provider profile, and `/v1/health` (should return `{"status":"ok"}`). Check search, type/area filtering and pagination. Use the included Netlify subdomain to start; an existing Namecheap domain can be connected through Netlify DNS instructions later. Domain purchases are separate from hosting.

Local verification: `npm run typecheck`, `npm run build`, `npm test`. The tests exercise both the standalone API and the serverless handler without requiring a live database. A real Neon connection and a Netlify deploy are still needed to verify the hosted integration.

`npm run package:functions` also validates the API with Netlify's official function packager and produces an ignored `.netlify/functions-packaged/api.zip`. This does not deploy anything.

## What remains

This is the initial read-only directory, not a completed migration of the legacy dashboards. Authentication, provider management, reviews and appointment workflows still require implementation. Upload storage, analytics and monitoring can be added later within chosen service limits.

No paid plan, account, database or deployment is created automatically by these configuration files. Monitor provider usage limits before sharing the site widely.

## Namecheap alternative

Namecheap shared hosting with MySQL is a different implementation path. It would need a compatible backend/runtime and replacement SQL/schema/search/geo logic; the current PostGIS queries cannot run on MySQL. A Namecheap domain can still be used with the Netlify deployment without that rewrite.
