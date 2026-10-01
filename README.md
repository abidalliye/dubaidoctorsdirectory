# FertiFind Dubai - IVF & Fertility Healthcare Directory

## Current published site

Initial hosting target: **Netlify Free + Neon Free**, with PostgreSQL search and no required Redis/Typesense hosting. See [DEPLOYMENT.md](DEPLOYMENT.md).

Netlify publishes the original HTML website below, preserving its design, navigation, profiles and dashboard pages. Run `npm run build:site` to build the site and NestJS backend. The directory reads public provider records from the NestJS API backed by Neon PostgreSQL, alongside existing page listings; offline/local-file previews retain the original listings.

`apps/web` contains the separate Next.js prototype and is not the published frontend. The NestJS backend is in `apps/api`. PostgreSQL/PostGIS, Redis and Typesense are defined in `compose.yaml`. See [ARCHITECTURE.md](ARCHITECTURE.md) for setup and API routes. Authentication, bookings, reviews, submissions and dashboard writes still use the original demo/local-storage integrations and are not connected to Neon. Patient, appointment and user fixture JSONs are excluded from the website build.

FertiFind Dubai is a comprehensive, responsive healthcare directory and patient discovery platform for fertility specialists, IVF clinics, women's hospitals, and diagnostic genetics laboratories across Dubai, UAE.

All provider details, clinic locations, and clinical services are enriched with verified research data from the Dubai Health Authority (DHA) registry.

---

## 🌟 Key Features

- **Multi-Page Connected Navigation**: Interconnected header navigation, mobile drawer menu, sticky profile tabs, and unified dark navy footer across all pages.
- **Directory Search & Live Filters**: Instant real-time filtering by provider type (doctors, clinics, hospitals, diagnostic labs), clinical specialties, treatments, distance radius, appointment availability, and patient ratings.
- **URL Parameter Routing**: Search queries from the homepage (`#heroSearch` and `#finder`) seamlessly route and auto-apply filters on the directory search page (`?q=...&type=...&area=...`).
- **Interactive Modals & Shortlist System**:
  - Direct Appointment Booking Modal (`FertiFind.openBooking`)
  - Verified Patient Review Submission Modal (`FertiFind.openReview`)
  - Practice Listing & Claiming Modal (`FertiFind.openListBusiness`)
  - Informational Popups (`FertiFind.openInfo`)
  - LocalStorage-powered Provider Shortlisting (`FertiFind.toggleShortlist`)
  - Toast Notification System (`FertiFind.toast`)
- **Verified Research Data Integration**:
  - **Clinics**: Orchid Fertility Clinic (DHCC), Fakih IVF Fertility Center (Jumeirah 2), Bourn Hall Fertility Clinic (Jumeirah 1), ART Fertility Clinics.
  - **Hospitals**: American Hospital Dubai (Oud Metha & DHCC partner unit), Dr. Sulaiman Al Habib Hospital, Mediclinic City Hospital.
  - **Doctors**: Dr. Partha Sarathi Das (Consultant Reproductive Medicine & Infertility, 20+ years exp), Dr. Michael Fakih, Dr. Dalia Khalife, Dr. Amal Shunnar.
  - **Genetics Labs**: Igenomix Dubai (Reproductive Genetics & PGT-A / ERA testing), First Genomix.
  - **Clinical Embryologists**: Estee Van Zyl, Hughlene Leonore Baker.
- **Responsive Design**: Clean medical theme (Deep Navy `#102a63`, Royal Blue `#0757d9`, Teal `#16b9ad`, Mint `#e9fbf8`) optimized across desktop, tablet, and mobile devices.

---

## 📁 Repository Structure

```text
├── index.html                                  # Master landing page with search finder & featured providers
├── ivf_fertility_directory_landing_page.html   # Primary directory landing page
├── fertifind_dubai_directory_search_page.html  # Live directory search with multi-parameter filter sidebar
├── fertifind_hospital_profile_page.html        # Hospital profile (American Hospital Dubai / Orchid DHCC)
├── fertifind_doctor_profile_page.html          # Doctor profile (Dr. Partha Sarathi Das)
├── fertifind_labs_profile_page.html            # Diagnostic lab profile (Igenomix Dubai Genetics)
├── css/
│   └── style.css                               # Unified brand stylesheet and responsive framework
├── js/
│   └── site.js                                 # Site controller, modal systems, search routing, toast
├── Dubai_Fertility_Directory_Research_2026.xlsx # Research dataset of Dubai fertility providers
└── excel_data.json                             # Extracted research data for clinics, hospitals, doctors, labs
```

---

## 🚀 Getting Started

To view the website locally, clone the repository and open `index.html` in any modern web browser:

```bash
git clone https://github.com/abidalliye/dubaidoctorsdirectory.git
cd dubaidoctorsdirectory
```

Open `index.html` directly or serve via any static file server:

```bash
# Python 3
python -m http.server 8000

# Node.js npx
npx serve .
```

Visit `http://localhost:8000` in your web browser.

---

## 📄 License & Verification

All provider records and healthcare licensing information are referenced from publicly accessible Dubai Health Authority (DHA) registries and official healthcare facilities.
