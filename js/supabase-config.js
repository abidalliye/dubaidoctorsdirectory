/**
 * Supabase Client Configuration & High-Performance Data Layer
 * Doctors Directory Dubai
 * https://supabase.com
 */

(function (window) {
  'use strict';

  // Config Keys
  const STORAGE_KEYS = {
    url: 'ff_supabase_url',
    key: 'ff_supabase_key',
    doctors: 'ff_db_doctors',
    clinics: 'ff_db_clinics',
    appointments: 'ff_db_appointments',
    patients: 'ff_db_patients',
    reviews: 'ff_db_reviews',
    blogs: 'ff_db_blogs',
    submissions: 'ff_db_submissions'
  };

  // Stored or Default Configuration
  const SUPABASE_URL = localStorage.getItem(STORAGE_KEYS.url) || 'https://vkmuxfqzcqkegymubtyv.supabase.co';
  const SUPABASE_ANON_KEY = localStorage.getItem(STORAGE_KEYS.key) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummy';

  let client = null;
  let isLive = false;

  // Initialize Supabase Client if SDK is loaded
  function initClient() {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        const url = localStorage.getItem(STORAGE_KEYS.url);
        const key = localStorage.getItem(STORAGE_KEYS.key);
        if (url && key && !key.includes('dummy')) {
          client = window.supabase.createClient(url, key);
          isLive = true;
          console.info('⚡ Supabase Client Connected Live:', url);
        } else {
          // Client with default/cached configuration
          client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
          isLive = false;
        }
      } catch (err) {
        console.warn('Supabase initialization fallback:', err.message);
        client = null;
        isLive = false;
      }
    }
  }

  // Pre-populate offline cache from _data/*.json if local storage is empty
  async function seedOfflineCache() {
    try {
      const [docs, clis, apts, pats, revs, blgs] = await Promise.all([
        fetch('_data/doctors.json').then(r => r.json()).catch(() => []),
        fetch('_data/clinics.json').then(r => r.json()).catch(() => []),
        fetch('_data/appointments.json').then(r => r.json()).catch(() => []),
        fetch('_data/patients.json').then(r => r.json()).catch(() => []),
        fetch('_data/reviews.json').then(r => r.json()).catch(() => []),
        fetch('_data/blogs.json').then(r => r.json()).catch(() => [])
      ]);

      if (docs && docs.length && !localStorage.getItem(STORAGE_KEYS.doctors)) {
        localStorage.setItem(STORAGE_KEYS.doctors, JSON.stringify(docs));
      }
      if (clis && clis.length && !localStorage.getItem(STORAGE_KEYS.clinics)) {
        localStorage.setItem(STORAGE_KEYS.clinics, JSON.stringify(clis));
      }
      if (apts && apts.length && !localStorage.getItem(STORAGE_KEYS.appointments)) {
        localStorage.setItem(STORAGE_KEYS.appointments, JSON.stringify(apts));
      }
      if (pats && pats.length && !localStorage.getItem(STORAGE_KEYS.patients)) {
        localStorage.setItem(STORAGE_KEYS.patients, JSON.stringify(pats));
      }
      if (revs && revs.length && !localStorage.getItem(STORAGE_KEYS.reviews)) {
        localStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify(revs));
      }
      if (blgs && blgs.length && !localStorage.getItem(STORAGE_KEYS.blogs)) {
        localStorage.setItem(STORAGE_KEYS.blogs, JSON.stringify(blgs));
      }
    } catch (e) {
      console.warn('Initial cache fetch skipped:', e.message);
    }
  }

  // Local Storage Helpers
  function getLocal(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch (e) {
      return [];
    }
  }

  function setLocal(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // High-Level Data API
  const FertiSupabase = {
    isConfigured: () => {
      const u = localStorage.getItem(STORAGE_KEYS.url);
      const k = localStorage.getItem(STORAGE_KEYS.key);
      return Boolean(u && k && !k.includes('dummy'));
    },

    getClient: () => client,

    // Test a custom URL & Key
    testConnection: async (testUrl, testKey) => {
      if (!window.supabase) return { success: false, error: 'Supabase JS SDK not loaded.' };
      try {
        const testClient = window.supabase.createClient(testUrl, testKey);
        const { data, error } = await testClient.from('doctors').select('id').limit(1);
        if (error) throw error;
        return { success: true, count: data ? data.length : 0 };
      } catch (err) {
        return { success: false, error: err.message };
      }
    },

    // Save Credentials to Local Storage
    saveConfig: (url, key) => {
      localStorage.setItem(STORAGE_KEYS.url, (url || '').trim());
      localStorage.setItem(STORAGE_KEYS.key, (key || '').trim());
      initClient();
    },

    // 1. DOCTORS
    getDoctors: async () => {
      if (FertiSupabase.isConfigured() && client) {
        try {
          const { data, error } = await client.from('doctors').select('*').order('name');
          if (!error && data && data.length) {
            setLocal(STORAGE_KEYS.doctors, data);
            return data;
          }
        } catch (e) {
          console.warn('Supabase getDoctors fallback to cache:', e.message);
        }
      }
      return getLocal(STORAGE_KEYS.doctors);
    },

    addDoctor: async (doctorData) => {
      const doc = {
        id: doctorData.id || 'DOC-' + Date.now().toString().slice(-4),
        name: doctorData.name,
        specialty: doctorData.specialty,
        category: doctorData.category || 'General Medicine',
        clinic_name: doctorData.clinic || doctorData.clinic_name || 'Dubai Medical Center',
        clinic: doctorData.clinic || doctorData.clinic_name || 'Dubai Medical Center',
        area: doctorData.area || 'Dubai Healthcare City',
        dha_license: doctorData.dhaLicense || doctorData.dha_license || 'DHA-P-00' + Math.floor(10000 + Math.random() * 90000),
        dhaLicense: doctorData.dhaLicense || doctorData.dha_license || 'DHA-P-00' + Math.floor(10000 + Math.random() * 90000),
        phone: doctorData.phone || '+971 4 377 5500',
        whatsapp: doctorData.whatsapp || '+971 50 112 3344',
        consultation_fee: Number(doctorData.consultationFee || doctorData.consultation_fee || 500),
        consultationFee: Number(doctorData.consultationFee || doctorData.consultation_fee || 500),
        rating: 5.0,
        reviews_count: 0,
        appointments_count: 0,
        status: 'Active',
        avatar: doctorData.avatar || '👨‍⚕️'
      };

      // Push to Supabase if configured
      if (FertiSupabase.isConfigured() && client) {
        try {
          await client.from('doctors').insert([doc]);
        } catch (e) {
          console.warn('Live addDoctor note:', e.message);
        }
      }

      // Update local storage
      const list = getLocal(STORAGE_KEYS.doctors);
      list.unshift(doc);
      setLocal(STORAGE_KEYS.doctors, list);
      return doc;
    },

    // 2. CLINICS
    getClinics: async () => {
      if (FertiSupabase.isConfigured() && client) {
        try {
          const { data, error } = await client.from('clinics').select('*').order('name');
          if (!error && data && data.length) {
            setLocal(STORAGE_KEYS.clinics, data);
            return data;
          }
        } catch (e) {
          console.warn('Supabase getClinics fallback:', e.message);
        }
      }
      return getLocal(STORAGE_KEYS.clinics);
    },

    // 3. APPOINTMENTS
    getAppointments: async () => {
      if (FertiSupabase.isConfigured() && client) {
        try {
          const { data, error } = await client.from('appointments').select('*').order('created_at', { ascending: false });
          if (!error && data && data.length) {
            setLocal(STORAGE_KEYS.appointments, data);
            return data;
          }
        } catch (e) {
          console.warn('Supabase getAppointments fallback:', e.message);
        }
      }
      return getLocal(STORAGE_KEYS.appointments);
    },

    bookAppointment: async (booking) => {
      const appt = {
        id: booking.id || 'APT-' + Date.now().toString().slice(-4),
        patient_name: booking.patientName || booking.name || 'Patient',
        patientName: booking.patientName || booking.name || 'Patient',
        doctor_name: booking.doctorName || booking.doctor || 'Dubai Specialist',
        doctorName: booking.doctorName || booking.doctor || 'Dubai Specialist',
        specialty: booking.specialty || 'General Medicine',
        service: booking.service || 'Consultation',
        date_time: booking.dateTime || booking.date || new Date().toISOString().split('T')[0],
        dateTime: booking.dateTime || booking.date || new Date().toISOString().split('T')[0],
        time_slot: booking.timeSlot || booking.slot || '10:00 AM',
        timeSlot: booking.timeSlot || booking.slot || '10:00 AM',
        phone: booking.phone || '',
        email: booking.email || '',
        notes: booking.notes || '',
        status: booking.status || 'Confirmed',
        source: booking.source || 'Online Directory',
        created_at: new Date().toISOString()
      };

      // 1. Push appointment to Supabase
      if (FertiSupabase.isConfigured() && client) {
        try {
          await client.from('appointments').insert([appt]);
        } catch (e) {
          console.warn('Supabase appointment insert note:', e.message);
        }
      }

      // 2. Also record patient in patients table
      const pat = {
        id: 'PAT-' + Date.now().toString().slice(-4),
        name: appt.patient_name,
        phone: appt.phone,
        email: appt.email,
        appointments_count: 1,
        last_visit: appt.date_time,
        status: 'Active'
      };

      if (FertiSupabase.isConfigured() && client) {
        try {
          await client.from('patients').insert([pat]);
        } catch (e) {
          // ignore duplicate
        }
      }

      // Update local storage
      const appts = getLocal(STORAGE_KEYS.appointments);
      appts.unshift(appt);
      setLocal(STORAGE_KEYS.appointments, appts);

      const pats = getLocal(STORAGE_KEYS.patients);
      pats.unshift(pat);
      setLocal(STORAGE_KEYS.patients, pats);

      return appt;
    },

    updateAppointmentStatus: async (apptId, newStatus) => {
      if (FertiSupabase.isConfigured() && client) {
        try {
          await client.from('appointments').update({ status: newStatus }).eq('id', apptId);
        } catch (e) {
          console.warn('Supabase update status note:', e.message);
        }
      }
      const appts = getLocal(STORAGE_KEYS.appointments);
      const target = appts.find(a => a.id === apptId);
      if (target) {
        target.status = newStatus;
        setLocal(STORAGE_KEYS.appointments, appts);
      }
    },

    // 4. PATIENTS
    getPatients: async () => {
      if (FertiSupabase.isConfigured() && client) {
        try {
          const { data, error } = await client.from('patients').select('*').order('last_visit', { ascending: false });
          if (!error && data && data.length) {
            setLocal(STORAGE_KEYS.patients, data);
            return data;
          }
        } catch (e) {
          console.warn('Supabase getPatients fallback:', e.message);
        }
      }
      return getLocal(STORAGE_KEYS.patients);
    },

    addPatient: async (patientData) => {
      const pat = {
        id: patientData.id || 'PAT-' + Date.now().toString().slice(-4),
        name: patientData.name,
        phone: patientData.phone,
        email: patientData.email || '',
        appointments_count: 1,
        last_visit: new Date().toISOString().split('T')[0],
        status: 'Active'
      };

      if (FertiSupabase.isConfigured() && client) {
        try {
          await client.from('patients').insert([pat]);
        } catch (e) {
          console.warn('Supabase addPatient note:', e.message);
        }
      }

      const pats = getLocal(STORAGE_KEYS.patients);
      pats.unshift(pat);
      setLocal(STORAGE_KEYS.patients, pats);
      return pat;
    },

    // 5. REVIEWS
    getReviews: async () => {
      if (FertiSupabase.isConfigured() && client) {
        try {
          const { data, error } = await client.from('reviews').select('*').order('created_at', { ascending: false });
          if (!error && data && data.length) {
            setLocal(STORAGE_KEYS.reviews, data);
            return data;
          }
        } catch (e) {
          console.warn('Supabase getReviews fallback:', e.message);
        }
      }
      return getLocal(STORAGE_KEYS.reviews);
    },

    submitReview: async (reviewData) => {
      const rev = {
        id: reviewData.id || 'REV-' + Date.now().toString().slice(-4),
        doctor_name: reviewData.doctorName || reviewData.doctor || 'Dubai Doctor',
        doctorName: reviewData.doctorName || reviewData.doctor || 'Dubai Doctor',
        patient_name: reviewData.patientName || reviewData.name || 'Verified Patient',
        patientName: reviewData.patientName || reviewData.name || 'Verified Patient',
        rating: Number(reviewData.rating || 5),
        treatment: reviewData.treatment || 'Consultation',
        comment: reviewData.comment || 'Excellent care and professionalism.',
        verified: true,
        date_posted: new Date().toISOString().split('T')[0],
        date: new Date().toISOString().split('T')[0]
      };

      if (FertiSupabase.isConfigured() && client) {
        try {
          await client.from('reviews').insert([rev]);
        } catch (e) {
          console.warn('Supabase review insert note:', e.message);
        }
      }

      const revs = getLocal(STORAGE_KEYS.reviews);
      revs.unshift(rev);
      setLocal(STORAGE_KEYS.reviews, revs);
      return rev;
    },

    // 6. PRACTICE SUBMISSIONS
    submitPractice: async (practiceData) => {
      const sub = {
        id: 'SUB-' + Date.now().toString().slice(-4),
        facility_name: practiceData.name || 'Medical Facility',
        name: practiceData.name || 'Medical Facility',
        category: practiceData.category || 'Clinic',
        lead_doctor: practiceData.leadDoctor || '',
        years_in_dubai: practiceData.yearsInDubai || '',
        accreditations: practiceData.accreditations || 'DHA Licensed',
        area: practiceData.area || 'Dubai',
        address: practiceData.address || '',
        parking: practiceData.parking || '',
        dha_license: practiceData.dhaLicense || 'DHA-F-' + Math.floor(10000 + Math.random() * 90000),
        dhaLicense: practiceData.dhaLicense || 'DHA-F-' + Math.floor(10000 + Math.random() * 90000),
        phone: practiceData.phone || '',
        whatsapp: practiceData.whatsapp || '',
        email: practiceData.email || '',
        website: practiceData.website || '',
        services: Array.isArray(practiceData.services) ? practiceData.services.join(', ') : (practiceData.services || ''),
        fee: Number(practiceData.fee || 500),
        insurance: Array.isArray(practiceData.insurance) ? practiceData.insurance.join(', ') : (practiceData.insurance || ''),
        plan: practiceData.plan || 'Featured Specialist',
        status: 'Pending',
        created_at: new Date().toISOString()
      };

      if (FertiSupabase.isConfigured() && client) {
        try {
          await client.from('practice_submissions').insert([sub]);
          // Also create in clinics table
          await client.from('clinics').insert([{
            id: 'CLI-' + Date.now().toString().slice(-4),
            name: sub.facility_name,
            category: sub.category,
            lead_doctor: sub.lead_doctor,
            area: sub.area,
            address: sub.address,
            dha_license: sub.dha_license,
            phone: sub.phone,
            whatsapp: sub.whatsapp,
            email: sub.email,
            website: sub.website,
            plan: sub.plan,
            status: 'Pending'
          }]);
        } catch (e) {
          console.warn('Supabase practice submission note:', e.message);
        }
      }

      const subs = getLocal(STORAGE_KEYS.submissions);
      subs.unshift(sub);
      setLocal(STORAGE_KEYS.submissions, subs);
      return sub;
    },

    // 7. BLOGS
    getBlogs: async () => {
      if (FertiSupabase.isConfigured() && client) {
        try {
          const { data, error } = await client.from('blogs').select('*').order('published_on', { ascending: false });
          if (!error && data && data.length) {
            setLocal(STORAGE_KEYS.blogs, data);
            return data;
          }
        } catch (e) {
          console.warn('Supabase getBlogs fallback:', e.message);
        }
      }
      return getLocal(STORAGE_KEYS.blogs);
    },

    // 8. ONE-CLICK DATA SEEDING TO LIVE SUPABASE
    seedAllData: async () => {
      if (!FertiSupabase.isConfigured() || !client) {
        return { success: false, message: 'Please enter and save your Supabase URL & Anon Key first.' };
      }

      try {
        const [docs, clis, apts, pats, revs, blgs] = await Promise.all([
          fetch('_data/doctors.json').then(r => r.json()).catch(() => []),
          fetch('_data/clinics.json').then(r => r.json()).catch(() => []),
          fetch('_data/appointments.json').then(r => r.json()).catch(() => []),
          fetch('_data/patients.json').then(r => r.json()).catch(() => []),
          fetch('_data/reviews.json').then(r => r.json()).catch(() => []),
          fetch('_data/blogs.json').then(r => r.json()).catch(() => [])
        ]);

        let insertedCount = 0;

        if (clis.length) {
          const { error } = await client.from('clinics').upsert(clis.map(c => ({
            id: c.id,
            name: c.name,
            category: c.category,
            lead_doctor: c.leadDoctor || '',
            area: c.area || 'Dubai',
            address: c.address || '',
            dha_license: c.dhaLicense,
            phone: c.phone || '',
            whatsapp: c.whatsapp || '',
            email: c.email || '',
            website: c.website || '',
            services: c.services || '',
            fee: Number(c.fee || 0),
            insurance: c.insurance || '',
            plan: c.plan || 'Verified Free Listing',
            rating: Number(c.rating || 5.0),
            reviews_count: Number(c.reviewsCount || 0),
            status: c.status || 'Verified'
          })));
          if (!error) insertedCount += clis.length;
        }

        if (docs.length) {
          const { error } = await client.from('doctors').upsert(docs.map(d => ({
            id: d.id,
            name: d.name,
            specialty: d.specialty,
            category: d.category,
            clinic_id: d.clinic_id || null,
            clinic_name: d.clinic,
            area: d.area,
            dha_license: d.dhaLicense,
            phone: d.phone,
            whatsapp: d.whatsapp,
            email: d.email || '',
            consultation_fee: Number(d.consultationFee || 500),
            experience: d.experience || '',
            languages: d.languages || '',
            education: d.education || '',
            rating: Number(d.rating || 5.0),
            reviews_count: Number(d.reviewsCount || 0),
            appointments_count: Number(d.appointmentsCount || 0),
            status: d.status || 'Active',
            avatar: d.avatar || '👨‍⚕️'
          })));
          if (!error) insertedCount += docs.length;
        }

        if (pats.length) {
          const { error } = await client.from('patients').upsert(pats.map(p => ({
            id: p.id,
            name: p.name,
            phone: p.phone,
            email: p.email,
            area: p.area || 'Dubai',
            appointments_count: Number(p.appointments || 1),
            last_visit: p.lastVisit || new Date().toISOString().split('T')[0],
            primary_doctor: p.primaryDoctor || '',
            status: p.status || 'Active'
          })));
          if (!error) insertedCount += pats.length;
        }

        if (apts.length) {
          const { error } = await client.from('appointments').upsert(apts.map(a => ({
            id: a.id,
            patient_name: a.patientName,
            doctor_name: a.doctorName,
            specialty: a.specialty,
            service: a.service || 'Consultation',
            date_time: a.dateTime || new Date().toISOString().split('T')[0],
            time_slot: a.timeSlot || '10:00 AM',
            phone: a.phone,
            email: a.email || '',
            notes: a.notes || '',
            status: a.status || 'Confirmed',
            source: a.source || 'Online Directory'
          })));
          if (!error) insertedCount += apts.length;
        }

        if (revs.length) {
          const { error } = await client.from('reviews').upsert(revs.map(r => ({
            id: r.id,
            doctor_name: r.doctorName,
            patient_name: r.patientName,
            rating: Number(r.rating || 5),
            treatment: r.treatment || 'Consultation',
            comment: r.comment || '',
            verified: Boolean(r.verified),
            date_posted: r.date || new Date().toISOString().split('T')[0]
          })));
          if (!error) insertedCount += revs.length;
        }

        if (blgs.length) {
          const { error } = await client.from('blogs').upsert(blgs.map(b => ({
            id: b.id,
            slug: b.id,
            title: b.title,
            description: b.description || '',
            author: b.author || 'Editorial Team',
            category: b.category || 'Guides',
            published_on: b.publishedOn || new Date().toISOString().split('T')[0],
            read_time: b.readTime || '5 min read',
            views: Number(b.views || 0),
            status: b.status || 'Published'
          })));
          if (!error) insertedCount += blgs.length;
        }

        return { success: true, message: `Successfully seeded ${insertedCount} records to Supabase tables!` };
      } catch (err) {
        return { success: false, message: 'Seeding error: ' + err.message };
      }
    }
  };

  // Expose to window
  window.FertiSupabase = FertiSupabase;

  // Initialize on script load
  window.addEventListener('DOMContentLoaded', () => {
    initClient();
    seedOfflineCache();
  });

})(window);
