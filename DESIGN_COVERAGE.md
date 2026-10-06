# CareAtlas reference audit and implementation ledger

3 October 2026. All 37 supplied PNGs inspected using original-resolution image reads. This is an implementation checklist, not a claim of completed pages. Existing NestJS authentication and relational care workflows are retained. No production database changes made during audit.

## Revised sequence

1. Complete source inventory and field contracts (this document), preserve uncommitted work.
2. Rebuild homepage composition: compact navigation, photographic hero/search/video card, statistics strip, horizontal specialty/concern rails, tabbed provider cards, hospitals, clinics beside tests, process strip, business panels, articles, FAQ and closing banner.
3. Rebuild administrator overview: 230px dark navigation, 56px toolbar, four metric cards, three charts, bookings/payments/quick actions, ranking/content/status panels. Use server aggregates, not capped client lists, for totals and charts. Date changes must refetch aggregates; show failures as unavailable.
4. Rebuild distinct public search, facility, professional, taxonomy, condition, location, editorial, onboarding and booking compositions in source order below. Keep source image differences rather than redirecting everything to a generic directory.
5. Rebuild role-specific overview panels and preserve existing functional CRUD views. Audit and close every pending field/API contract below.
6. Run typecheck, production build and isolated integration/security tests. Start isolated preview; inspect desktop/tablet/mobile and save actual screenshots. Only then prepare deployment switch, additive migration verification and legacy redirects.
7. Release gate: no unverified privacy changes, no invented integration status, reviewed visual comparisons and passing functional checks. Existing Netlify configuration still serves legacy HTML.

## Visual rules from references

Public pages: pale blue background, tightly spaced white cards, blue buttons, navy headings, horizontal pastel icon rails, photographic city/medical heroes and 2:1 primary/sidebar compositions. Home source is 823px wide and unusually dense; scale typography and card spacing for legible full-size desktop without turning it into oversized marketing sections. Dashboard source is 1536×1024, sidebar about 230px, 12–16px gutters, dense tables, white cards with modest radii. Doctor and hospital supplied references have the same visible composition. Their actual role data must differ.

Source sample figures, credentials, provider portraits and reviews are not database evidence. Promotional imagery must stay separate from real provider identities. Source clinical claims, insurance laws, prices and emergency details require maintained reviewed content rather than copying screenshot text. All forms override the reference's visible labels per user instruction: aria-label plus ≤3-word prompts, multi-column layout. Unconfigured video/payment/email integrations get truthful states.

## Reference checklist

All entries: inspected ✓; implementation and responsive verification pending unless recorded in the verification log. Field group letters refer to the contracts below.

| Source PNG | Route / view | Distinct composition and interactions | Fields |
|---|---|---|---|
| DirectoryHomePage | / | Hero search tabs; specialty/concern rails; provider tabs; hospital cards; clinics/test split; business cards; FAQ accordion | P,T,S,C,R |
| directorysearch | /directory | Filter/results/map three-column layout; pagination, location request, map selection | P,T,S,F |
| doctorsearchpage | /doctors | Doctor hero; left filters; detailed result rows; map/sidebar; fees and availability | P,T,S,F |
| CompareDoctorPage | /doctors/compare | Up to four selectable columns, remove/add, share, attribute matrix and booking | P,S,R,F |
| doctorprofile | /doctors/[slug] | Portrait identity block; section tabs; education timeline; service cards; sticky booking/contact | P,S,R,B |
| HopitalsinDubaipage | /hospitals | Hospital-type rail; list/map split; specialty/service tiles; insurance | P,T,S |
| ClinicsinDubaipage | /clinics | Clinic hero; specialty rail; result rows with next slot; right filter/map | P,T,S,F |
| hospitalprofile | /facilities/[slug] | Gallery identity masthead; doctor cards; services; reviews; contact/booking sidebar | P,S,R,B |
| hospitalpage2 | /facilities/[slug]/departments | Building hero; department grid; photographic facilities; doctors/reviews; right booking | P,T,S,R,B |
| labtestsndiagnosticspages | /lab-tests | Lab hero; tests and prescription upload split; category/package cards; collection options | P,T,S,D |
| Individual Lab Test Page | /lab-tests/[id] | Test hero; price comparison table; preparation/content; related tests; booking sidebar | S,C,B |
| labtechnicianprofile | /laboratories/[slug] | Source is a laboratory profile: gallery, tests, staff, booking/sidebar; technician variant uses professional fields | P,S,R,B |
| specialitiespage | /specialties | Image rail; category grid; age/gender cards; doctors/tests by specialty | T,P,S,C |
| speciality | /specialties/[slug] | Specialty hero; services rail; filters/results/sidebar; fee table | T,P,S,C |
| speciality2 | /conditions/[slug] | Condition hero; overview/symptoms; related doctors/tests; treatment/complication grids | T,C,P,S |
| specilistindubaipage | /specialties/[slug]/[city] | Fertility editorial hero; contents rail; causes/symptoms/stages/treatments; doctor sidebar | C,T,P,S |
| symptomsnhealthconditionspage | /conditions | Symptom photo grid; body-area and age rails; symptom-to-specialty search | T,C,P |
| healthcareatozpage | /healthcare-a-z | A–Z selector/list; popular condition photo grid; provider sidebar | T,C,P |
| Healthcareindubailocationpage | /locations/[city] | Area photo rail; large map; left filter; provider cards and care-category panels | T,P,S,F |
| Healthcareocationpage | /locations/[city]/[area] | Area hero/tabs; description/map split; providers/search split; nearby-area rail | T,P,S,F |
| InsurancePage | /insurance | Insurer rail; plan-type cards; comparison table; coverage tabs | T,C,P,I |
| emergencycaredubaipage | /emergency-care | Dark emergency hero; verified call action; red warning tiles; care-option comparison and map | C,P,T |
| blog.png | /blog | Consultation photo hero/search; 16 topic icon tiles; featured/related article image cards; latest articles; topic lists; closing care banner | C,P |
| LoginPage | /auth | Join hero; role cards; account form; profile step; benefits sidebar | A,D |
| listyourbusinesspage | /list-your-business | Practice hero; role/billing toggles; pricing cards/table; onboarding steps | P,C,I |
| submitlisting | /listings/new | Hero with compact starter form; business-type photo cards; process/benefits | A,P |
| submitlistingform | /listings/[id]/edit | Five-step progress; section cards; upload/preview/checklist sidebar; save/resume | P,S,D |
| claimnverifylistings | /listings/[id]/claim | Five-step claim flow; search/result; identity/evidence; review confirmation | A,P,D,Q |
| doctorappointmentbookingpage | /doctors/[slug]/booking | Professional overview variant; service table; qualifications; booking sidebar | P,S,R,B |
| doctorappointmentbookingdetailspage | /book/[slug] | Four-step flow; visit/location cards; day/slot selection; patient fields; summary | B,A,D,S |
| appointmentconfirmationpage | /appointments/[id]/confirmation | Actual status banner; details/actions; location; invoice; private patient/upload sections | B,D,I |
| videoconsultaion | /video-consultation | Video hero/search; specialty/concern rails; eligible providers; process; integration state | P,S,B,C |
| admin | /dashboard/admin | Four metrics; booking/revenue/donut row; bookings/payments/actions; rankings/content/status | O,P,B,I,C,A,Q |
| doctor | /dashboard/doctor | Five metrics; appointment/revenue/department row; bookings/lab tests; doctors/tests/reviews | O,P,B,D,I,R |
| hospital | /dashboard/facility | Same supplied visual as doctor; facility branches/team/department and business controls | O,P,B,D,I,R |
| LabTechnician | /dashboard/lab | Five metrics; bookings/revenue/test donut; bookings/results; service table; tasks/performance | O,S,B,D,I,R |
| patients | /dashboard/patient | Five metrics; next appointment/doctors/profile; history/prescriptions; records/payments; reminders | O,A,B,D,I,R,F |

## Field contracts and gaps

| Group / screen controls | Database destination and API | Roles/privacy/validation | Verification and missing work |
|---|---|---|---|
| A: name,email,phone,role,password; recovery | app_users; app_sessions; account_tokens; auth/*; account profile | Self; admin account edits. Hash passwords; unique email; role allowlist; CSRF/session | Register/login/logout/recover; expired sessions; role escalation; last admin. Existing APIs retained |
| A: profile step, completion, birth date, gender, contact, preferences | app_users.profile via dashboard profile schema | Self/admin, private; schema allowlist | Save step, reload and resume; field-level coverage to audit |
| P: name,slug,kind,specialty,area,address,phone,website,services,description,photo | providers typed columns + validated details; account/providers and admin/providers | Owner/team/admin; published-only public read | Draft save, approval, edit and restore; independent doctor/lab; no inferred credentials |
| P: optional affiliations | provider_affiliations; dashboard facilities/provider APIs | Authorized membership, valid facility IDs | Independent profile works; unrelated ownership cannot be granted |
| P: branches and coordinates | care_branches: name,country,city,address,latitude,longitude,phone; care/providers/:id/details | Owner/authorized team; bounded coordinates | Add/edit/remove/reload, foreign-owner denial |
| P: hours, licenses, team, gallery | care_provider_hours; care_licenses; provider_memberships.permission; care_media | Owner/team per permission; private license proof; image type/size | Repeatable rows persist; team cannot elevate own permission; media limits disclosed |
| T: taxonomy, locations, insurers, conditions | care/public/taxonomy derives providers; CMS taxonomy data needs complete contract | Public published data; admin curated metadata | Counts match queries. Condition relationships and insurer plan schema remain gaps |
| S: name,description,price,duration,mode,preparation | care_services; care/services; care/public/services | Owner/team/admin; nonnegative minor units; 5–480 min | Save/reload and public publication; video rejected until configured |
| S: dates,slots | care_slots; care/slots; care/public/slots/:service | Owner/team; future valid ranges and unique service/start | Concurrent booking, cancellation release, overlap checks |
| B: patient/dependent,slot,reason,insurance,name,phone,status,price | care_appointments; care_history; care/appointments and reschedule | Participant; server price and state transitions; dependent ownership | Confirmation must show Requested until accepted; cancel/reschedule/history |
| D: dependent name,birth date,relationship | care_dependents; care/dependents | Owning patient; valid date and relationship | Cross-patient access rejection |
| D: note,prescription,lab order/report,message,title,body,status,file | care_records; care/records; account_files; dashboard/files | Authorized encounter participant; draft/release and lab roles | Private download, unrelated user denial, report release. Structured prescription items/message threads still gaps |
| I: amount,currency,status,method,paid date | care_invoices; care/invoices | Provider records received offline payment; patient read only | No fabricated card success; issued/paid/cancelled transitions. Refunds/subscriptions/insurance plan comparisons need explicit schema and integration |
| R: rating,comment,publication | care_reviews; care/reviews; public reviews | Completed-appointment patient; admin moderation | One review per appointment; no screenshot testimonials; published aggregates |
| F: saved provider | care_favorites; care/favorites | Self; unique user/provider | Toggle/reload; anonymous sign-in state |
| F: filters,sort,page,comparison | URL query/local selection; providers search | Public only, input allowlist | Each supported filter affects query; map requires actual coordinates; no fabricated distances |
| Q: claim provider,evidence,status,reviewer | care_claims; care/claims | Claimant own request; admin decision | No grant before approval; private structured evidence files and claim wizard remain gaps |
| C: article/page title,body,category,author,status,slug,FAQ | dashboard_articles/pages/faqs data; dashboard/records/:module; content/:module | Authorized author/admin; published public | CRUD/publish; article detail distinct from index. Comments, author relationships and reviewed medical metadata still gaps |
| O: totals,booking statuses/daily trend,listing mix,paid total | care/overview server SQL, role scope and Dubai dates | Authenticated scope; admin operations only | Date boundaries and aggregate consistency. Revenue trend, post count and rankings need server queries before rendering |
| O: notification title/read state | care_notifications; care/notifications | Recipient only | Mark read persists; database notification is not email delivery |

## External dependencies / release blockers

Email sender credentials/domain; payment merchant/webhook setup; video appointment-session integration; external storage retention/access policy. No paid provisioning authorized. Map tiles/provider choice and reviewed emergency/medical/legal copy must be verified before publication. Existing database file storage can retain supported small uploads. Production secrets must never appear in logs or source.

## Verification log

- Audit: all supplied references read at original resolution; source folders untouched.
- Baseline backend test report from prior chat is not treated as a fresh result.
- No release, migration or production verification completed in this audit.

### 5 October 2026 — implementation checkpoint

- Added detailed search rows, fee/mode/availability filters, database-backed service/review/slot summaries and a provider-address map selector. Doctor search desktop inspected; fee filtering verified in browser. Tablet hero contrast corrected after screenshot review. Mobile verification remains in progress.
- Added distinct professional/facility profile compositions, public affiliation cards, gallery links, credentials, section navigation and a service/slot booking sidebar. The selected slot is carried into the booking flow. Profile desktop inspected using synthetic data.
- Added patient, practice and laboratory overview panels with server-scoped metrics. New metrics exclude unrelated users and anonymous access; integration tests cover those boundaries and date validation. Browser checks are in progress.
- Fixed saved-provider state restoration, comparison capacity (four), typed administrator listing navigation, clinic quick-action type, draft/create heading, Dubai date filtering, and a public mobile menu.
- Added an original promotional Dubai healthcare banner with the built-in image generator: apps/web/public/images/dubai-care-hero.png. Fictional promotional people are not used as provider identities. Source prompt recorded in the adjacent asset notes.
- Typecheck passes. Latest complete test run: 7 tests passed, 0 failed (5 October). One preceding run missed the smoke-test startup deadline while development services were starting; a full rerun passed without relaxing the test.
- Current production build still needs rerunning after these changes. Existing Netlify deployment and production database remain unchanged. These checkpoints do not mark the 37-design rebuild complete.

## 6 October: blog submission priority
Dedicated dashboard editor now supports drafts, cover uploads (PNG/JPEG, 1 MB), alternative image URLs, image descriptions, author, summary, category, tags, featured placement, formatted headings/bold/lists, preview and publishing. Business authors submit for admin review; administrators publish. Draft covers are private and covers linked to clinical records are excluded from public serving. No migration required.
The blog index now follows blog.png's hero, topic tiles, bordered article panels and image cards, with hover states and reduced-motion support. Article count and content are database-backed; newsletter and most-read claims were not fabricated. Production contains no synthetic posts. Remaining source-design corrections outside the blog are still pending.
Verification: seven integration/security tests pass, production build passes, isolated browser upload/draft/publish/search flow passes, editor and blog have no horizontal overflow at 390 px. Screenshots are in scratch/review.
