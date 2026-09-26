# Supabase Database Setup Guide
**Doctors Directory Dubai**

This directory is powered by **Supabase PostgreSQL**, providing enterprise scalability, sub-millisecond search queries, Row Level Security (RLS), and a built-in Airtable-style data editor (**Supabase Studio**).

---

### Step 1: Create a Free Supabase Project (1 Minute)
1. Go to [https://supabase.com](https://supabase.com) and sign up / log in with your GitHub account.
2. Click **New Project**.
3. Enter:
   - **Name**: `dubaidoctorsdirectory`
   - **Database Password**: Choose a secure password.
   - **Region**: Select **Middle East (UAE)** or **Europe (Frankfurt / London)** for lowest latency.
4. Click **Create new project**.

---

### Step 2: Run the Schema & Data Migration (1 Click)
1. In your Supabase project dashboard, click on the **SQL Editor** tab in the left sidebar (icon with `>_`).
2. Click **New query**.
3. Open `supabase/schema.sql` from this repository, copy all contents, paste it into the editor, and click **Run**.
4. ✅ All 8 tables (`doctors`, `clinics`, `appointments`, `patients`, `reviews`, `practice_submissions`, `blogs`, `platform_settings`) with full RLS security policies and initial Dubai records will be created instantly.

---

### Step 3: Connect to the Website
1. In Supabase, go to **Project Settings** (gear icon) ➔ **API**.
2. Copy:
   - **Project URL** (e.g. `https://xyzprojectid.supabase.co`)
   - **Project API Key (`anon` `public`)**
3. Open the **Admin Dashboard** ([https://abidalliye.github.io/dubaidoctorsdirectory/admin.html](https://abidalliye.github.io/dubaidoctorsdirectory/admin.html)), scroll to the **Supabase Database Settings** section, paste the URL and Key, and click **Save & Connect**.

---

### Step 4: Manage Your Directory with Supabase Studio
- In your Supabase dashboard, click **Table Editor** (spreadsheet icon) in the left sidebar.
- You have an edge-to-edge, lightning-fast spreadsheet view of all doctors, clinics, appointments, and reviews with instant sorting, filters, export to CSV/JSON, and granular role management.
