# Accounts and permissions

The original HTML site authenticates with NestJS and Neon PostgreSQL. No demo
users, default passwords or browser-storage sessions are accepted. Passwords
use salted scrypt. Random session tokens are stored as SHA-256 hashes in the
database and sent in seven-day Secure/HttpOnly/SameSite cookies on Netlify.
Mutation requests require an allowed Origin, application header and, when
authenticated, a session-bound CSRF token. Authentication and account responses
are never cached. PostgreSQL counters limit login/signup/mail attempts across
serverless instances.

Apply `infra/db/002-auth.sql` after the directory schema, or run `npm run db:migrate`
with DATABASE_URL configured privately. Existing listings are preserved.

| Role | Permissions |
| --- | --- |
| Patient | Read/edit own account, change own password |
| Doctor | Own account; create/edit owned draft directory profiles |
| Clinic/hospital | Own account; create/edit owned draft facility profiles |
| Admin | Manage user roles/status, approve listings, assign ownership, read audit log |

Provider signups start pending. Registration never accepts admin as a role.
Drafts are unpublished. Every directory edit returns the profile to review;
only an administrator can publish/verify it. Assignment of an existing listing
is an administrator action; a matching email/name/license never grants ownership.
User role/status changes revoke their sessions. Disabled users cannot authenticate.
The last active administrator cannot be removed through the API. Newly elevated
administrators must have verified email addresses.

The first administrator must register their own account and choose their own
password. An operator then grants the role through trusted database access after
confirming the account with the owner. Do not create a publicly accessible
bootstrap endpoint or automatically grant admin to a claimed email address.
For this deployment, the owner designated `abidalliye@gmail.com`.

## Routes

- POST `/v1/auth/register`, `/login`, `/forgot`, `/reset`, `/verify`
- GET `/v1/auth/me`
- POST `/v1/auth/logout`, `/password`, `/verification` (session required)
- GET/PATCH `/v1/account/profile`
- GET/POST `/v1/account/providers`; PATCH `/v1/account/providers/:id`
- GET `/v1/admin/users`, `/providers`, `/audit`
- PATCH `/v1/admin/users/:id` (role/status only)
- PATCH `/v1/admin/providers/:id` (published/verified/ownerId only)

Private profile edits cannot modify roles, status, email verification or user ID.
Patient profiles are never returned by the public directory API. Medical records
and government identifiers are not collected by this account module.

## Email

Set `RESEND_API_KEY` privately in Netlify, and `EMAIL_FROM` to a sender/domain
verified in Resend. `WEB_ORIGIN` supplies the link origin. Reset/verification
links expire after 30 minutes and are single-use; password resets revoke every
session. Without email configuration, the UI reports that delivery is unavailable
instead of claiming it sent a message. Existing authenticated users can change
their password without email. Email changes are deliberately not exposed until
a verified change-of-address workflow is implemented.

## Remaining modules

Bookings, clinical records, reports, video consultations, billing and prescription
workflows are separate modules. The dashboard marks these unavailable and removes
seeded/demo records rather than presenting them as actual account data. The new
account controls preserve the original pages and shared styling. Deprecated
Supabase/Firebase browser SDK integrations are no longer loaded by the pages.
