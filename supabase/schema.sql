-- ==============================================================================
-- DOCTORS DIRECTORY DUBAI - SUPABASE POSTGRESQL SCHEMA & INITIAL SEEDING
-- Platform: https://supabase.com
-- Database Engine: PostgreSQL 15+ with Row Level Security (RLS)
-- ==============================================================================

-- Enable UUID extension for unique ID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. CLINICS & HOSPITALS TABLE
-- ==============================================================================
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

-- ==============================================================================
-- 2. DOCTORS DIRECTORY TABLE
-- ==============================================================================
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

-- ==============================================================================
-- 3. PATIENTS REGISTRY TABLE
-- ==============================================================================
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

-- ==============================================================================
-- 4. APPOINTMENTS QUEUE TABLE
-- ==============================================================================
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

-- ==============================================================================
-- 5. PATIENT REVIEWS TABLE
-- ==============================================================================
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

-- ==============================================================================
-- 6. PRACTICE SUBMISSIONS TABLE (B2B Lead Funnel)
-- ==============================================================================
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

-- ==============================================================================
-- 7. BLOG & PROGRAMMATIC SEO ARTICLES
-- ==============================================================================
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

-- ==============================================================================
-- 8. PLATFORM SETTINGS
-- ==============================================================================
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

-- Public READ policies (anyone can browse directory)
CREATE POLICY "Public read clinics" ON clinics FOR SELECT USING (true);
CREATE POLICY "Public read doctors" ON doctors FOR SELECT USING (true);
CREATE POLICY "Public read reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Public read blogs" ON blogs FOR SELECT USING (status = 'Published');
CREATE POLICY "Public read settings" ON platform_settings FOR SELECT USING (true);

-- Public INSERT policies (patients can book & review, clinics can submit)
CREATE POLICY "Public insert appointments" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read own appointments" ON appointments FOR SELECT USING (true);
CREATE POLICY "Public update appointments status" ON appointments FOR UPDATE USING (true);
CREATE POLICY "Public insert reviews" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert practice submissions" ON practice_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert patients" ON patients FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read patients" ON patients FOR SELECT USING (true);
CREATE POLICY "Public update patients" ON patients FOR UPDATE USING (true);

-- Admin CRUD policies (full access)
CREATE POLICY "Admin manage clinics" ON clinics FOR ALL USING (true);
CREATE POLICY "Admin manage doctors" ON doctors FOR ALL USING (true);
CREATE POLICY "Admin manage blogs" ON blogs FOR ALL USING (true);
CREATE POLICY "Admin manage submissions" ON practice_submissions FOR ALL USING (true);
CREATE POLICY "Admin manage settings" ON platform_settings FOR ALL USING (true);

-- ==============================================================================
-- INITIAL DATA SEEDING (Dubai Healthcare Directory)
-- ==============================================================================

-- 1. Insert Clinics
INSERT INTO clinics (id, name, category, lead_doctor, years_in_dubai, accreditations, area, address, parking, dha_license, phone, whatsapp, email, website, services, fee, insurance, plan, rating, reviews_count, status)
VALUES
('CLI-001', 'Orchid Fertility Clinic', 'Fertility Centre', 'Dr. Sara Al Maktoum', '9 years', 'DHA Accredited, CAP Laboratory Certified', 'Dubai Healthcare City', 'Ibn Sina Building 27, Block D, Unit 201, DHCC, Dubai', 'Free Valet Parking Available', 'DHA-F-0038912', '+971 4 437 7520', '+971 50 477 3832', 'info@orchid-fertility.com', 'https://orchid-fertility.com/', 'IVF, ICSI, PGT-A Genetic Screening, Egg Freezing, Blastocyst Culture, IUI', 25000, 'Daman, NextCare, MetLife, AXA Gulf, Sukoon, Bupa Global', 'Featured Specialist', 4.9, 210, 'Verified'),
('CLI-002', 'First IVF Day Surgery Center', 'Clinic', 'Dr. Michael Chen', '12 years', 'DHA Licensed, ESHRE Quality Standards', 'Jumeirah', 'Jumeirah Beach Road, Villa 412, Jumeirah 2, Dubai', 'Dedicated Patient Parking Onsite', 'DHA-F-0041289', '+971 4 700 8900', '+971 50 890 1234', 'care@firstivf.ae', 'https://firstivf.ae/', 'IVF, Advanced Laparoscopy, Day Surgery, Embryo Banking, Andrology Lab', 28000, 'NextCare, AXA, Sukoon, Cigna, Allianz Worldwide Care', 'Featured Specialist', 4.8, 165, 'Verified'),
('CLI-003', 'American Hospital Dubai', 'Hospital', 'Dr. Ahmed Khan', '26 years', 'JCI Accredited, CAP Laboratory, DHA Apex Hospital', 'Oud Metha', '19th Street, Oud Metha, Dubai', 'Complimentary Valet & Multi-story Parking', 'DHA-H-0001004', '+971 4 377 5500', '+971 50 112 3344', 'contact@ahdubai.com', 'https://www.ahdubai.com/', 'Cardiology, IVF, Oncology, Orthopedics, Pediatrics, 24/7 Emergency', 550, 'All Major UAE & International Health Insurance Plans Accepted', 'Clinic Showcase', 4.9, 520, 'Verified'),
('CLI-004', 'Fakih IVF Fertility Center', 'Fertility Centre', 'Dr. Fatima Zahra', '14 years', 'DHA Licensed, Joint Commission International (JCI)', 'Downtown Dubai', 'Boulevard Plaza Tower 1, Level 5, Downtown Dubai', 'Valet Parking & Downtown Parking Lots', 'DHA-F-0029481', '+971 4 349 7600', '+971 50 234 5678', 'info@fakihivf.com', 'https://fakihivf.com/', 'IVF, Gender Selection, PGT-M, Male Infertility, Micro-TESE, Surrogacy Advice', 32000, 'Daman, MetLife, NextCare, AXA, Cigna, Sukoon', 'Clinic Showcase', 4.9, 380, 'Verified'),
('CLI-005', 'Igenomix Dubai Genetics Laboratory', 'Diagnostic Lab', 'Dr. David Morales', '8 years', 'CAP Accredited, ISO 15189 Certified Medical Genetic Testing', 'Dubai Healthcare City', 'Al Razi Building 64, Block B, Unit 1002, DHCC, Dubai', 'Underground Paid RTA Parking', 'DHA-L-0081293', '+971 4 437 0820', '+971 50 998 8776', 'middle.east@igenomix.com', 'https://www.igenomix.net/', 'PGT-A, PGT-M, ERA Endometrial Receptivity, Carrier Genetic Test (CGT), NIPT', 3000, 'Direct billing & Reimbursement Support', 'Featured Specialist', 4.8, 140, 'Verified')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();

-- 2. Insert Doctors
INSERT INTO doctors (id, name, specialty, category, clinic_id, clinic_name, area, address, dha_license, phone, whatsapp, email, consultation_fee, experience, languages, education, rating, reviews_count, appointments_count, status, avatar, featured)
VALUES
('DOC-001', 'Dr. Ahmed Khan', 'Cardiologist', 'Cardiology', 'CLI-003', 'American Hospital Dubai', 'Oud Metha', '19th St, Oud Metha, Dubai', 'DHA-P-0019284', '+971 4 377 5500', '+971 50 112 3344', 'dr.ahmed.khan@ahdubai.com', 550, '16 years', 'English, Arabic, Urdu', 'MBBS, MD Cardiology (Imperial College London)', 4.9, 245, 125, 'Active', '👨‍⚕️', TRUE),
('DOC-002', 'Dr. Sara Al Maktoum', 'Reproductive Endocrinologist & IVF', 'Reproductive Endocrinology', 'CLI-001', 'Orchid Fertility Clinic', 'Dubai Healthcare City', 'Ibn Sina Building 27, DHCC, Dubai', 'DHA-P-0028193', '+971 4 437 7520', '+971 50 477 3832', 'dr.sara@orchid-fertility.com', 750, '18 years', 'English, Arabic, French', 'MBBS, FRCOG, Fellowship in Reproductive Medicine (Oxford)', 5.0, 312, 198, 'Active', '👩‍⚕️', TRUE),
('DOC-003', 'Dr. Michael Chen', 'Dermatologist & Cosmetic Specialist', 'Dermatology', 'CLI-002', 'First IVF & Medical Surgery Center', 'Jumeirah', 'Jumeirah Beach Road, Villa 412, Jumeirah 2, Dubai', 'DHA-P-0034918', '+971 4 700 8900', '+971 50 890 1234', 'dr.chen@firstivf.ae', 450, '14 years', 'English, Mandarin', 'MD Dermatology, American Board Certified', 4.8, 189, 94, 'Active', '👨‍⚕️', FALSE),
('DOC-004', 'Dr. Fatima Zahra', 'Obstetrician & Gynecologist', 'Gynecology', 'CLI-004', 'Fakih IVF Fertility Center', 'Downtown Dubai', 'Boulevard Plaza Tower 1, Downtown Dubai', 'DHA-P-0048192', '+971 4 349 7600', '+971 50 234 5678', 'dr.fatima@fakihivf.com', 600, '20 years', 'English, Arabic', 'MBBS, MRCOG, Specialist Reproductive Surgery', 4.9, 420, 260, 'Active', '👩‍⚕️', TRUE),
('DOC-005', 'Dr. Tariq Mansoor', 'Orthopedic Surgeon', 'Orthopedics', 'CLI-003', 'Mediclinic City Hospital', 'Dubai Healthcare City', 'Building 37, DHCC, Dubai', 'DHA-P-0056193', '+971 4 435 9999', '+971 50 567 8901', 'dr.tariq@mediclinic.ae', 700, '22 years', 'English, Arabic, German', 'FRCS (Orth), European Board of Orthopaedics', 4.7, 164, 88, 'Active', '👨‍⚕️', FALSE),
('DOC-006', 'Dr. Layla Rostami', 'Pediatric Specialist', 'Pediatrics', 'CLI-003', 'Emirates Hospital Jumeirah', 'Jumeirah', 'Jumeirah Beach Road, Dubai', 'DHA-P-0061294', '+971 4 349 6666', '+971 50 678 9012', 'dr.layla@emirateshospital.ae', 400, '12 years', 'English, Arabic, Persian', 'MD Pediatrics, Royal College of Paediatrics (UK)', 4.9, 280, 142, 'Active', '👩‍⚕️', FALSE),
('DOC-007', 'Dr. Omar Al Nuaimi', 'Urologist & Male Fertility Specialist', 'Urology', 'CLI-001', 'ART Fertility Clinics Dubai', 'Jumeirah', 'Villa 1029, Al Wasl Road, Jumeirah, Dubai', 'DHA-P-0078912', '+971 4 380 9900', '+971 50 789 0123', 'dr.omar@artfertility.com', 650, '17 years', 'English, Arabic', 'MD Urology, Fellow of the European Board of Urology', 4.8, 195, 110, 'Active', '👨‍⚕️', FALSE)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();

-- 3. Insert Patients
INSERT INTO patients (id, name, phone, email, area, appointments_count, last_visit, primary_doctor, status)
VALUES
('PAT-001', 'Mariam Al Hashemi', '+971 50 123 4567', 'mariam.hashemi@gmail.com', 'Jumeirah 1', 4, '2025-02-10', 'Dr. Sara Al Maktoum', 'Active'),
('PAT-002', 'Johnathan Edwards', '+971 52 987 6543', 'j.edwards@outlook.com', 'Downtown Dubai', 2, '2025-01-28', 'Dr. Ahmed Khan', 'Active'),
('PAT-003', 'Fatima Al Mansoori', '+971 55 456 7890', 'f.mansoori@gmail.com', 'Dubai Marina', 5, '2025-02-05', 'Dr. Fatima Zahra', 'Active'),
('PAT-004', 'Alexander Petrov', '+971 54 321 0987', 'alex.petrov@yahoo.com', 'Palm Jumeirah', 3, '2025-01-19', 'Dr. Michael Chen', 'Active')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();

-- 4. Insert Appointments
INSERT INTO appointments (id, patient_name, doctor_name, specialty, service, date_time, time_slot, phone, email, notes, status, source)
VALUES
('APT-1001', 'Mariam Al Hashemi', 'Dr. Sara Al Maktoum', 'Reproductive Endocrinology', 'Initial IVF Consultation & Ultrasound', '2025-02-14', '10:00 AM', '+971 50 123 4567', 'mariam.hashemi@gmail.com', 'Infertility consultation, previously completed hormone bloodwork', 'Confirmed', 'Online Directory'),
('APT-1002', 'Johnathan Edwards', 'Dr. Ahmed Khan', 'Cardiology', 'Executive Cardiac Health Checkup', '2025-02-14', '11:30 AM', '+971 52 987 6543', 'j.edwards@outlook.com', 'Annual executive cardiac health screening and stress ECG test', 'Pending', 'Online Directory'),
('APT-1003', 'Fatima Al Mansoori', 'Dr. Fatima Zahra', 'Gynecology', 'Pre-IVF Cycle Review & Scan', '2025-02-15', '02:00 PM', '+971 55 456 7890', 'f.mansoori@gmail.com', 'Second opinion review on ovarian stimulation protocol', 'Confirmed', 'Direct WhatsApp'),
('APT-1004', 'Alexander Petrov', 'Dr. Michael Chen', 'Dermatology', 'Comprehensive Skin Screening', '2025-02-16', '04:00 PM', '+971 54 321 0987', 'alex.petrov@yahoo.com', 'Routine skin checkup and mole dermoscopy inspection', 'Confirmed', 'Online Directory'),
('APT-1005', 'Noura Rashid', 'Dr. Layla Rostami', 'Pediatrics', 'Infant Developmental Milestone Check', '2025-02-17', '09:30 AM', '+971 50 876 5432', 'noura.rashid@gmail.com', '6-month comprehensive pediatric immunization and developmental check', 'Pending', 'Online Directory')
ON CONFLICT (id) DO UPDATE SET patient_name = EXCLUDED.patient_name, updated_at = NOW();

-- 5. Insert Reviews
INSERT INTO reviews (id, doctor_name, patient_name, rating, treatment, comment, verified, date_posted)
VALUES
('REV-001', 'Dr. Sara Al Maktoum', 'Mariam A.', 5, 'IVF with ICSI & PGT-A Screening', 'Exceptional care from Dr. Sara and the entire Orchid embryology laboratory team. Successful cycle on our very first attempt! Transparent guidance throughout.', TRUE, '2025-02-02'),
('REV-002', 'Dr. Ahmed Khan', 'Rashid K.', 5, 'Cardiovascular Assessment & Stress Test', 'Very professional, patient-centric, and thorough. Explained all findings with clear medical diagrams. Highly recommended cardiologist in Dubai.', TRUE, '2025-01-25'),
('REV-003', 'Dr. Michael Chen', 'Sophie M.', 5, 'Laser Dermatology & Skin Rejuvenation', 'Dr. Chen is a master of his craft. Very gentle, punctual, and the clinic in Jumeirah is pristine and welcoming.', TRUE, '2025-01-18'),
('REV-004', 'Dr. Fatima Zahra', 'Layla H.', 5, 'Fertility Assessment & Blastocyst Transfer', 'Compassionate, reassuring, and always reachable on WhatsApp. Fakih IVF provided state-of-the-art facilities.', TRUE, '2025-01-12')
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Blogs
INSERT INTO blogs (id, slug, title, description, author, category, published_on, read_time, views, status)
VALUES
('blg-001', 'complete-guide-to-ivf-in-dubai', 'The Complete Guide to IVF & Fertility Clinics in Dubai (2025/2026)', 'Everything couples need to know about fertility treatments, DHA regulatory approvals, ICSI success rates, and transparent cost breakdowns in Dubai, UAE.', 'Dr. Amal Al Maktoum', 'IVF & Fertility Guides', '2025-01-15', '6 min read', 1420, 'Published'),
('blg-002', 'how-to-choose-the-best-cardiologist-in-dubai', 'How to Choose the Best Cardiologist in Dubai: DHA Verification Guide', 'Expert tips on evaluating cardiologist credentials, clinic hospital affiliations, diagnostic facilities, and international accreditations across Dubai.', 'Dr. Ahmed Khan', 'Doctor Spotlights', '2025-01-20', '5 min read', 980, 'Published'),
('blg-003', 'dha-regulations-on-genetic-testing', 'DHA Regulations on Pre-implantation Genetic Testing (PGT-A / PGT-M)', 'An authoritative review of UAE federal law and Dubai Health Authority directives on embryo screening, family balancing, and inherited disorder prevention.', 'Dr. David Morales', 'DHA Compliance', '2025-02-01', '7 min read', 860, 'Published'),
('blg-004', 'dubai-healthcare-city-fertility-hub', 'Why Dubai Healthcare City (DHCC) Has Become the Middle East Fertility Hub', 'Examining the medical infrastructure, multinational clinical talent, and patient-first regulations driving medical tourism into Dubai Healthcare City.', 'Medical Tourism Editorial Board', 'Medical Tourism', '2025-02-08', '4 min read', 740, 'Published')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, updated_at = NOW();

-- 7. Insert Settings
INSERT INTO platform_settings (key, value)
VALUES
('site_meta', '{"siteName": "Doctors Directory Dubai", "adminEmail": "admin@dubaidoctorsdirectory.ae", "supportPhone": "+971 4 377 5500", "currency": "AED", "usdRate": 3.6725}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
