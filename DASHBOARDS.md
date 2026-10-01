# Database-backed dashboards

All four dashboards use the same server-provided field schema (`apps/api/src/dashboard-schema.ts`). There are no mock dashboard records and no client database credentials. Local file dashboard links redirect to the hosted backend.

## Field storage

| Form | Database mapping |
|---|---|
| Patient/business profile wizard | `app_users.name`, `phone`, and validated `profile` JSONB keys |
| Directory details | `providers` core columns plus validated business `details` JSONB |
| Optional clinic/hospital links | `provider_affiliations` foreign keys; ownership remains in `provider_memberships` |
| Appointments | `dashboard_appointments.data` |
| Reviews | `dashboard_reviews.data` |
| Invoices / payments | `dashboard_payments.data` |
| Articles / bulletins | `dashboard_articles.data` |
| Admissions / procedure records | `dashboard_admissions.data` |
| Clinical notes | `dashboard_notes.data` |
| Prescription records | `dashboard_prescriptions.data` |
| Lab collection requests | `dashboard_lab_requests.data` |
| Document metadata / file | `dashboard_documents.data` and private `account_files.content` |
| Fees / availability | `dashboard_tariffs.data`, `dashboard_schedules.data` |
| Saved providers / patient contacts | `dashboard_saved_providers.data`, `dashboard_patients.data` |
| Website settings | `site_settings.data` |

Each JSON field is explicitly described and validated in the shared server schema. Unknown keys, invalid URLs/dates/numbers and oversized values are rejected. Records have stable IDs, owner IDs, timestamps, pagination and archive status. Files are authenticated downloads of PDF/PNG/JPEG documents up to 1 MB, not publicly hosted medical documents.

## Ownership and roles

Every user can edit their own profile; administrators can edit other profiles and permissions. Users cannot grant themselves roles. Doctors, labs, surgeons, technicians, clinics and hospitals have independent accounts. Any business account or administrator can create doctor/lab/facility listings with optional affiliations. Listings require administrator publication; editing returns them to review. Private patient fields never enter public directory profiles.

Dashboard records are visible to their creator and administrators, not automatically shared with a patient or another business. Patient appointment/lab statuses require provider confirmation and reviews default to Pending. Recordkeeping does not process payments, launch video calls, deliver prescriptions, send notifications or integrate laboratory systems. Those require separate integrations.

## Deployment

Run `003-dashboard.sql` against the existing database before deploying. `npm run db:migrate` runs both account and dashboard migrations. Netlify publishes the original public design with the new dashboard UI and NestJS APIs. Public business details are available on `provider-profile.html?slug=...`; owners and administrators can preview their unpublished drafts.
