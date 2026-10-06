# Directory implementation plan

Revised 3 October 2026. Status: existing connected implementation audited; visual rebuild in progress, unverified and not deployed. See DESIGN_COVERAGE.md for the reference audit and field ledger.

## 1. Decision and scope

Rebuild the frontend using Next.js, React, TypeScript, and Tailwind, using only the 37 supplied PNG designs in `Dashboards` and `LandingPages`. Retain and extend the existing NestJS API, Neon PostgreSQL/PostGIS database, authentication, administrator account, and real directory records. Do not delete the current site or reset its database.

The existing `apps/web` prototype is a starting code scaffold only. Its old visual design will be replaced. The current HTML site continues serving visitors until the replacement passes the cutover checks. Preserve original URLs through redirects where routes change.

Use the current free Netlify/Neon deployment initially. Netlify supports Next.js routing and rendering through its OpenNext integration ([official documentation](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/)). Keep NestJS serverless endpoints for the initial deployment; long-running work must use a separate job mechanism. Typesense, Redis, AWS, and paid services are later additions when demand justifies them, rather than mandatory initial costs.

The provisional configurable brand is CareAtlas. Preserve supplied visual compositions while replacing inconsistent sample names and statistics with actual site data. No Netlify promotional branding will be introduced.

## 2. Findings that determine the work

- References contain five role dashboards and 32 public pages. They cover a much larger product than the current directory.
- Authentication, roles, provider ownership, optional facility affiliations, basic dashboard CRUD, CMS, and admin overview queries already exist.
- Many current dashboard records use owner-scoped JSON data and free-text names. They do not yet form a shared patient/provider/facility workflow. Replacing screens alone would leave the main problem unresolved.
- Existing public HTML includes static content. Public records, counts, availability, prices, reviews, and profile details must come from database queries.
- Private uploads currently use limited database-backed storage. Larger galleries and clinical attachments need a proper storage abstraction and configured object storage.
- Email delivery, payment processing, and video conferencing are not configured. Their database workflows can be built first, but external operations must remain explicitly unavailable until configured and tested.

## 3. Reference-to-page inventory

Each source below has an implementation destination. Related designs become purposeful views or steps rather than disconnected duplicate pages. All paths are proposed routes.

| Supplied reference | Destination and connected data |
| --- | --- |
| `Dashboards/admin.png` | `/dashboard/admin`: directory totals, bookings, financial ledger, CMS, users, reviews, settings, notifications |
| `Dashboards/doctor.png` | `/dashboard/doctor`: assigned appointments/patients, availability, prescriptions, lab orders, earnings, profile |
| `Dashboards/hospital.png` | `/dashboard/facility`: facility locations, authorized staff, linked professionals, appointments, admissions, billing |
| `Dashboards/LabTechnician.png` | `/dashboard/lab`: test catalog, collection slots, orders, samples, reports, technicians, invoices |
| `Dashboards/patients.png` | `/dashboard/patient`: appointments, dependents, care records, favorites, payments, reminders, messages |
| `DirectoryHomePage.png` | `/`: database search, featured listings, specialties, locations, published content |
| `directorysearch.png` | `/directory`: combined results, filters, sorting, map, pagination |
| `doctorsearchpage.png` | `/doctors`: doctor filters, availability, insurance, specialty, location |
| `doctorprofile.png` | `/doctors/[slug]`: professional profile, services, affiliations, hours, reviews, booking |
| `CompareDoctorPage.png` | `/doctors/compare`: selected records, actual comparable attributes, booking links |
| `HopitalsinDubaipage.png` | `/hospitals`: searchable hospital records |
| `ClinicsinDubaipage.png` | `/clinics`: searchable clinic records |
| `hospitalprofile.png` | `/facilities/[slug]`: facility overview, departments, services, insurance, gallery |
| `hospitalpage2.png` | Facility detail tabs: team, specialties, availability, locations, reviews |
| `labtestsndiagnosticspages.png` | `/lab-tests`: test catalog, providers, prices, preparation, collection modes |
| `Individual Lab Test Page.png` | `/lab-tests/[slug]`: test details, eligible laboratories, real price and booking |
| `labtechnicianprofile.png` | `/professionals/[slug]`: technician profile, qualifications, services, organization links |
| `specialitiespage.png` | `/specialties`: taxonomy index and listing counts |
| `speciality.png` | `/specialties/[slug]`: specialty information and matching providers |
| `speciality2.png` | `/conditions/[slug]`: condition overview, symptoms, treatments, related care and reviewed content |
| `specilistindubaipage.png` | `/specialties/[slug]/[city]`: location-specific provider results and approved editorial content |
| `symptomsnhealthconditionspage.png` | `/conditions`: condition index, reviewed content, related specialties |
| `healthcareatozpage.png` | `/healthcare-a-z`: searchable taxonomy/content index |
| `Healthcareindubailocationpage.png` | `/locations/[city]`: city directory, categories, map and counts |
| `Healthcareocationpage.png` | `/locations/[city]/[area]`: area-specific directory and content |
| `InsurancePage.png` | `/insurance`: insurer/plan directory and participating providers |
| `emergencycaredubaipage.png` | `/emergency-care`: maintained factual contacts and relevant facilities |
| `Blog.png` | `/blog/[slug]`: article hero, author, contents rail, body, related providers and articles; `/blog` is the supporting index |
| `LoginPage.png` | `/auth`: sign-in, registration and role selection; password recovery/verification views |
| `listyourbusinesspage.png` | `/list-your-business`: listing benefits, real plans, start-listing actions |
| `submitlisting.png` | `/listings/new`: business-type choice and onboarding introduction |
| `submitlistingform.png` | `/listings/[id]/edit`: saved multi-step business form and live preview |
| `claimnverifylistings.png` | `/listings/[id]/claim`: ownership evidence, review status and administrator decision |
| `doctorappointmentbookingpage.png` | `/book/[provider]`: appointment type, location, date and available slot |
| `doctorappointmentbookingdetailspage.png` | Booking steps: patient/dependent, reason, attachments, insurance/payment, review |
| `appointmentconfirmationpage.png` | `/appointments/[id]/confirmation`: actual state, reference, invoice and permitted actions |
| `videoconsultaion.png` | `/video-consultation`: eligible providers, scheduled booking and authorized session access |

Doctor and hospital references share much of their layout. Reuse the visual structure but give each role the correct menu, queries and actions. Surgeon uses the doctor workflow; clinic uses the facility workflow. Laboratory owners and technicians have different permissions within the lab layout.

## 4. Visual implementation rules

Extract navigation, sidebar, spacing, colors, typography, cards, tables, charts, filters, booking panels, stepper, modal, and footer patterns from the supplied references. Create reusable components from these patterns. Do not bring in a different dashboard theme or landing-page template.

Use navy text, blue primary actions, pale blue/gray page surfaces, white rounded cards and the supplied dark sidebar treatment. Reproduce the references' visual hierarchy and dense but readable grids. On smaller screens, collapse the sidebar and filter panels, stack cards sensibly and make wide tables scroll inside their containers.

Charts query actual records with documented date ranges. Empty databases show useful empty states rather than screenshot numbers. Images use supplied assets where available and lawful; missing portraits/gallery images use neutral placeholders. No fabricated ratings, license badges, insurance participation or availability.

### Forms and profile completion

- No visible field labels. Text placeholders and select prompts contain at most 2–3 words: `Full name`, `Business name`, `Phone number`, `License number`, `Street address`.
- Supply accessible names using `aria-label` or visually hidden text. Keep values understandable after placeholders disappear.
- Use two or three columns where space permits. Related name/contact/location fields share rows. Descriptions, media areas, maps and complex repeatable sections span the necessary width. Single-column stacking is reserved for narrow screens or deliberately large controls.
- Use short section headings, progress indicators, icons and inline validation. Date, upload, select and password controls have clear short prompts. Checkbox/radio option text remains necessary to explain choices and consent.
- Build beautiful multi-step profile dialogs for patients and business roles using the supplied stepper/card style. Include save-and-exit, resume, back, next, final review and server-side completion status.
- Persist each valid step as a draft. Reloading or signing in again restores it. Do not mark incomplete business profiles as published.
- Patients: identity/contact, optional personal details, dependents, preferences/consents and review. Sensitive health information is optional and private.
- Businesses: identity, location/contact, services/prices, hours/availability, credentials/team, media/insurance and review. Independent doctors/labs can complete these without choosing a clinic.

## 5. Database model and field coverage

Use typed columns, foreign keys, indexes and constraints for relationships and workflow state. Retain validated JSONB for bounded optional metadata and flexible CMS content. Every submitted field must have a documented persistence destination; derived fields must have a documented query.

| Data group | Planned records and relationships |
| --- | --- |
| Accounts | Users, sessions, verification/recovery tokens, role grants, account preferences, consent history |
| Patient profiles | Patient identity/contact, optional demographic details, dependents, authorized representatives |
| Provider profiles | Provider type, owner, public description, contact, slug, draft/publication/verification state |
| Facilities and teams | Facility branches, memberships/roles, invitations, optional professional affiliations, departments |
| Business details | Services, prices/currency/duration, weekly hours, exceptions, license records/expiry, qualifications, experience, media |
| Directory taxonomy | Specialties, conditions, locations, insurers/plans, provider-insurance and provider-specialty links |
| Availability | Schedules, generated slots, exceptions, capacities, temporary holds and booking constraints |
| Appointments | Patient/dependent, provider, optional facility, service, mode, slot/time zone, reason, attachments, state/history |
| Care records | Encounter access, notes, prescriptions/items, lab orders/items, sample events, results, signed reports, document grants |
| Financial records | Invoices/items, payment transactions, refund records, subscriptions, discounts, configured tax/fee rules |
| Engagement | Favorites, appointment-linked reviews, moderation/reports, message threads/participants, reminders, notifications |
| Ownership verification | Claim requests, private evidence, reviewer decisions, membership grants and audit events |
| Content | Articles, categories/tags, pages, FAQs, banners, publication/SEO metadata, revision history |
| Operations | Settings, audit trail, idempotency keys, job/outbox records, integration webhook processing |

Create a field coverage ledger before feature implementation. Each entry records: screen/control, field name and type, database table/column or relation, API contract, writable roles, validation, privacy classification and verification scenario. Include repeatable services/hours, uploads, filters, switches, computed cards and table actions. Reject unsupported request keys; never silently discard a submitted field.

Migrate legacy owner-scoped records incrementally. Resolve links using verified IDs or an explicit administrator mapping. Ambiguous free-text doctor/patient names must not become guessed medical relationships. Keep unmapped records available for reconciliation. Preserve original values and migration audit information.

## 6. Roles and permissions

“Anyone can update profiles” means every authenticated role can update their own profile, and authorized business team members can update their organization's records. It does not permit editing another person's account.

| Role | Allowed scope |
| --- | --- |
| Public | Published directory/content, public review summaries and actual bookable availability |
| Patient | Own profile/dependents, own bookings/documents/invoices, eligible reviews, authorized conversations |
| Doctor/surgeon | Own professional profile, assigned appointments and explicitly authorized patient care records |
| Clinic/hospital owner | Own facility profile, authorized staff/branches, facility appointments and permitted operational records |
| Lab owner | Own laboratory profile/catalog/team, laboratory orders/collection/report/billing workflow |
| Technician | Assigned lab tasks/results under team grants; cannot grant themselves ownership or approval powers |
| Administrator | Directory/CMS/user administration, approval/moderation and audited operational actions; clinical access requires explicit policy |

Enforce permissions in the API for reads, writes, searches, exports and downloads. Hiding a button is insufficient. Clinical access is based on participation and explicit grants, not merely having a business role. Maintain CSRF/session protections and last-active-administrator safeguards.

Doctors and laboratories can be created independently. Optional facility affiliations neither replace ownership nor force registration through a hospital. A facility cannot alter an independent doctor's private account through an affiliation.

## 7. Connected workflows and API contracts

Extend API families for authentication/accounts, providers/teams, taxonomy/search, services/availability, appointments, care/lab records, files, billing, reviews/claims, messages/notifications, CMS and administration. Use typed DTOs, consistent errors, pagination and server-calculated totals. Public responses exclude private account and clinical fields.

1. Business saves onboarding steps → submits listing → admin reviews → publishes → record appears in relevant searches and public profile. Changes requiring review cannot silently retain verification.
2. Independent professional creates services and slots → patient chooses self/dependent → server validates availability and price → atomically creates appointment → participants see the same appointment. Concurrent booking attempts cannot take the same capacity.
3. Provider accepts/rejects → state/history and participant notifications update. Confirmation pages say `Requested` until acceptance where approval is required. Reschedule/cancel respects policy, updates inventory and financial consequences.
4. Doctor creates an authorized lab order → lab accepts/collects/processes → authorized technician enters results → authorized reviewer releases report → patient receives permitted report access. Each stage has status history.
5. Server creates an invoice from actual services → payment provider verifies transaction via signed webhook → ledger/invoice update → receipt is available. Refund approval and processor completion are distinct states. Manual payments are clearly identified.
6. Patient reviews a completed eligible appointment → moderation policy applies → published review affects public aggregates. Reported reviews and provider replies retain history.
7. Claimant uploads ownership evidence → administrator decides → approved claim grants membership. Submitting a claim does not grant access.
8. CMS publication updates public pages; messages/reminders have real recipients, permissions and delivery/read states. A successful database save does not falsely report that email was delivered.

Video access is restricted to authorized appointment participants and actual configured meeting sessions. Medical uploads use authenticated access or short-lived authorized URLs. Public gallery media is separate from private documents.

## 8. Integrations and information needed

Existing email/password sign-in remains the first supported login method. Google, Apple and UAE Pass buttons are enabled only after their respective application credentials and callback domains are configured; do not show nonfunctional login buttons.

| Integration | Required before activation |
| --- | --- |
| Transactional email | Service credentials, approved sender/domain, delivery tests for recovery/verification/reminders |
| Payments | Chosen processor, merchant account, test/live credentials, webhook secret and actual currency/tax policy |
| Video | Chosen service, credentials and appointment-based access configuration |
| Object storage | S3/R2 or equivalent credentials, bucket/access policy, retention and size limits |
| Maps | Chosen map service/tiles and any required key; PostgreSQL/PostGIS remains location authority |
| Social sign-in | Provider app registration and credentials; existing password login remains available |

Keep secrets in deployment environment settings. Never ask for passwords in chat or commit secrets. Where integrations remain unconfigured, show a truthful unavailable state and preserve supported alternatives. Verify current service terms/free allowances before provisioning.

Content that needs owner confirmation includes brand, business plan/pricing policy, cancellation/refund policy, terms/privacy text, accurate emergency contacts and approved health information. Clinical articles and symptom content require qualified review; informational tools must not invent diagnoses or prescribe treatment.

## 9. Implementation sequence and gates

| Phase | Deliverable | Gate before proceeding |
| --- | --- | --- |
| 1. Audit and safety | Route/field coverage ledger, schema inventory, migration/cutover strategy, protected database snapshot | All 37 references and existing URLs accounted for; no destructive data reset |
| 2. Design foundation | Reference-derived tokens/components, responsive navigation, form grids, stepper/dialog and dashboard shell | Representative public/dashboard/onboarding views visually reviewed at desktop/tablet/mobile |
| 3. Relational backend | Incremental schema migrations, typed APIs, access grants, slots, workflow state and migration reconciliation | Permission, validation, transaction and migration checks pass |
| 4. Accounts and profiles | Registration/recovery, role routing, patient/business wizards, team management, independent listings | Drafts survive reload; own/authorized profile changes persist; cross-account requests rejected |
| 5. Public directory | Every mapped public route, filters/maps, real profiles/catalogs, comparison, CMS and SEO | Anonymous read coverage, valid links and database-derived content verified |
| 6. Booking and care | Availability, booking, acceptance, rescheduling, lab orders/reports, private documents | End-to-end patient/provider/lab workflow and slot concurrency verified |
| 7. Dashboards and operations | Five dashboard variants, admin CRUD, billing, claims, reviews, messages, reporting | Every sidebar item, action, modal, filter and chart has a real implementation |
| 8. Integrations | Configured email/storage/payment/video/social services | Sandbox delivery/webhook/access/error tests pass; unsupported integrations remain unavailable |
| 9. Release | Production build, migrations, route redirects, updated deployment/docs, monitored cutover | Visual, functional, permission and persistence acceptance checks pass; rollback ready |

Implementation should proceed in vertical slices: a screen, its fields, API, permissions, database and acceptance checks together. This prevents a large collection of finished-looking disconnected screens.

## 10. Verification and definition of done

- Every supplied reference has a working route/view; screenshots are compared against its composition at desktop, tablet and mobile widths.
- Every visible input persists to its intended record and restores after reload/new session. Required/optional validation, drafts and repeatable sections work.
- Visible placeholders contain no more than three words. No visible field labels; accessible names and keyboard/error navigation remain usable.
- Every navigation item, CTA, filter, sort, pagination control, switch, date range and row action has a valid destination or operation. No dummy `#` links or fabricated success messages.
- Public data is published/approved as appropriate; counts/charts handle zero records and filters correctly. Static sample figures never masquerade as production data.
- Patient, independent doctor, facility owner, lab owner, technician and admin journeys are exercised against a test database. Production verification uses limited reversible records with cleanup.
- Negative authorization checks cover cross-account IDs, role escalation, downloads, team invitations and clinical sharing. Sensitive data stays out of public APIs and analytics.
- Booking checks include concurrent attempts, duplicate submissions, time zones, unavailable slots, cancellations and reschedules. Billing checks include replayed webhooks and correct money calculations.
- Upload checks cover type/size validation, private/public access, failed transfers and retention. Profile pictures and medical reports have separate rules.
- SEO includes rendered public content, canonical URLs, sitemap, metadata and redirects. Structured data reflects actual approved records.
- Production build and relevant API/integration tests pass. No unresolved blocking errors, leaked secrets or irreversible migration dependencies. Document residual external-service limitations explicitly.

## 11. Release and preservation

Work on the existing feature branch or a dedicated `codex/` branch with reviewable commits. Keep user-supplied reference folders intact. Use additive migrations and backups before any data transformation. Change the Netlify build configuration only once the new frontend and API are validated together.

Preserve existing accounts, password hashes, ownership, real listing IDs and published URLs. Keep the previous deployment recoverable. Remove obsolete frontend code only after successful cutover and verification, not at the beginning of the rebuild.

The intended result is one connected directory product: public pages, profile completion, bookings, clinical/lab workflows, financial records and five role dashboards all operating on the same authorized database records.
