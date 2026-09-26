-- ==============================================================================
-- PART 1: DOCTORS DIRECTORY DUBAI - TABLES & SECURITY ONLY
-- Run this first in Supabase SQL Editor
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Clinics & Hospitals Table
CREATE TABLE IF NOT EXISTS clinics (
    id TEXT PRIMARY KEY DEFAULT ('CLI-' || substr(md5(random()::text), 1, 6)),
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Clinic',
    lead_doctor TEXT,
    years_in_dubai TEXT,
    accreditations TEXT,
    area TEXT NOT NULL,
    address TEXT,
    parking TEXT,
    dha_license TEXT UNIQUE,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    website TEXT,
    services TEXT,
    fee NUMERIC DEFAULT 0,
    insurance TEXT,
    plan TEXT DEFAULT 'Verified Free Listing',
    rating NUMERIC(3,2) DEFAULT 5.0,
    reviews_count INT DEFAULT 0,
    status TEXT DEFAULT 'Verified',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Doctors Directory Table
CREATE TABLE IF NOT EXISTS doctors (
    id TEXT PRIMARY KEY DEFAULT ('DOC-' || substr(md5(random()::text), 1, 6)),
    name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    category TEXT NOT NULL,
    clinic_id TEXT REFERENCES clinics(id) ON DELETE SET NULL,
    clinic_name TEXT,
    area TEXT NOT NULL,
    address TEXT,
    dha_license TEXT UNIQUE NOT NULL,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    consultation_fee NUMERIC DEFAULT 500,
    experience TEXT,
    languages TEXT,
    education TEXT,
    rating NUMERIC(3,2) DEFAULT 5.0,
    reviews_count INT DEFAULT 0,
    appointments_count INT DEFAULT 0,
    status TEXT DEFAULT 'Active',
    avatar TEXT DEFAULT '👨‍⚕️',
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Patients Registry Table
CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY DEFAULT ('PAT-' || substr(md5(random()::text), 1, 6)),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    area TEXT,
    appointments_count INT DEFAULT 1,
    last_visit DATE DEFAULT CURRENT_DATE,
    primary_doctor TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Appointments Queue Table
CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY DEFAULT ('APT-' || substr(md5(random()::text), 1, 6)),
    patient_id TEXT REFERENCES patients(id) ON DELETE SET NULL,
    patient_name TEXT NOT NULL,
    doctor_id TEXT REFERENCES doctors(id) ON DELETE SET NULL,
    doctor_name TEXT NOT NULL,
    clinic_id TEXT REFERENCES clinics(id) ON DELETE SET NULL,
    specialty TEXT,
    service TEXT,
    date_time DATE NOT NULL DEFAULT CURRENT_DATE,
    time_slot TEXT DEFAULT '10:00 AM',
    phone TEXT NOT NULL,
    email TEXT,
    notes TEXT,
    status TEXT DEFAULT 'Confirmed',
    source TEXT DEFAULT 'Online Directory',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Patient Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY DEFAULT ('REV-' || substr(md5(random()::text), 1, 6)),
    doctor_id TEXT REFERENCES doctors(id) ON DELETE CASCADE,
    doctor_name TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    treatment TEXT,
    comment TEXT NOT NULL,
    verified BOOLEAN DEFAULT TRUE,
    date_posted DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Practice Submissions Table
CREATE TABLE IF NOT EXISTS practice_submissions (
    id TEXT PRIMARY KEY DEFAULT ('SUB-' || substr(md5(random()::text), 1, 6)),
    facility_name TEXT NOT NULL,
    category TEXT NOT NULL,
    lead_doctor TEXT,
    years_in_dubai TEXT,
    accreditations TEXT,
    area TEXT NOT NULL,
    address TEXT,
    parking TEXT,
    dha_license TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    email TEXT NOT NULL,
    website TEXT,
    services TEXT,
    fee NUMERIC,
    insurance TEXT,
    plan TEXT DEFAULT 'Featured Specialist',
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Blogs Table
CREATE TABLE IF NOT EXISTS blogs (
    id TEXT PRIMARY KEY DEFAULT ('blg-' || substr(md5(random()::text), 1, 6)),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    author TEXT NOT NULL,
    category TEXT NOT NULL,
    published_on DATE DEFAULT CURRENT_DATE,
    read_time TEXT DEFAULT '5 min read',
    views INT DEFAULT 0,
    status TEXT DEFAULT 'Published',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Platform Settings Table
CREATE TABLE IF NOT EXISTS platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- 1. Clinics Policies
DROP POLICY IF EXISTS "Public read clinics" ON clinics;
CREATE POLICY "Public read clinics" ON clinics FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage clinics" ON clinics;
CREATE POLICY "Admin manage clinics" ON clinics FOR ALL USING (true);

-- 2. Doctors Policies
DROP POLICY IF EXISTS "Public read doctors" ON doctors;
CREATE POLICY "Public read doctors" ON doctors FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage doctors" ON doctors;
CREATE POLICY "Admin manage doctors" ON doctors FOR ALL USING (true);

-- 3. Patients Policies
DROP POLICY IF EXISTS "Public read patients" ON patients;
CREATE POLICY "Public read patients" ON patients FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert patients" ON patients;
CREATE POLICY "Public insert patients" ON patients FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update patients" ON patients;
CREATE POLICY "Public update patients" ON patients FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Admin manage patients" ON patients;
CREATE POLICY "Admin manage patients" ON patients FOR ALL USING (true);

-- 4. Appointments Policies
DROP POLICY IF EXISTS "Public read own appointments" ON appointments;
CREATE POLICY "Public read own appointments" ON appointments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert appointments" ON appointments;
CREATE POLICY "Public insert appointments" ON appointments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update appointments status" ON appointments;
CREATE POLICY "Public update appointments status" ON appointments FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Admin manage appointments" ON appointments;
CREATE POLICY "Admin manage appointments" ON appointments FOR ALL USING (true);

-- 5. Reviews Policies
DROP POLICY IF EXISTS "Public read reviews" ON reviews;
CREATE POLICY "Public read reviews" ON reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert reviews" ON reviews;
CREATE POLICY "Public insert reviews" ON reviews FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin manage reviews" ON reviews;
CREATE POLICY "Admin manage reviews" ON reviews FOR ALL USING (true);

-- 6. Practice Submissions Policies
DROP POLICY IF EXISTS "Public insert practice submissions" ON practice_submissions;
CREATE POLICY "Public insert practice submissions" ON practice_submissions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin manage submissions" ON practice_submissions;
CREATE POLICY "Admin manage submissions" ON practice_submissions FOR ALL USING (true);

-- 7. Blogs Policies
DROP POLICY IF EXISTS "Public read blogs" ON blogs;
CREATE POLICY "Public read blogs" ON blogs FOR SELECT USING (status = 'Published');
DROP POLICY IF EXISTS "Admin manage blogs" ON blogs;
CREATE POLICY "Admin manage blogs" ON blogs FOR ALL USING (true);

-- 8. Platform Settings Policies
DROP POLICY IF EXISTS "Public read settings" ON platform_settings;
CREATE POLICY "Public read settings" ON platform_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage settings" ON platform_settings;
CREATE POLICY "Admin manage settings" ON platform_settings FOR ALL USING (true);
