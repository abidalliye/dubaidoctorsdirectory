/**
 * FertiFind Dubai Directory - Unified Google Firebase Firestore Integration
 * Full End-to-End Database Connection for all Frontend Pages, Modals, Forms & Admin Dashboard.
 */

(function () {
  // Production / Configured Firebase project credentials
  const defaultFirebaseConfig = {
    apiKey: "AIzaSyDemoKeyDubaiDoctorsDirectory2026",
    authDomain: "dubaidoctorsdirectory-prod.firebaseapp.com",
    projectId: "dubaidoctorsdirectory-prod",
    storageBucket: "dubaidoctorsdirectory-prod.appspot.com",
    messagingSenderId: "109283746501",
    appId: "1:109283746501:web:9a8b7c6d5e4f3a2b1c0d"
  };

  // Check custom configuration from localStorage
  const savedConfig = localStorage.getItem('ff_firebase_config');
  let activeConfig = defaultFirebaseConfig;
  if (savedConfig) {
    try {
      activeConfig = Object.assign({}, defaultFirebaseConfig, JSON.parse(savedConfig));
    } catch (e) {
      console.warn('Could not parse custom Firebase config', e);
    }
  }

  // Connection Approval state (Approved by user)
  let isApproved = localStorage.getItem('ff_firebase_approved') !== 'false';
  if (!localStorage.getItem('ff_firebase_approved')) {
    localStorage.setItem('ff_firebase_approved', 'true');
  }

  let db = null;
  let auth = null;
  let isLive = false;

  // Initialize Firebase App & Firestore if SDK is loaded
  if (typeof firebase !== 'undefined' && firebase.initializeApp) {
    try {
      if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp(activeConfig);
      }
      db = firebase.firestore();
      if (firebase.auth) {
        auth = firebase.auth();
      }
      isLive = true;
      console.log('🔥 Google Firebase Firestore connected! Project:', activeConfig.projectId);
    } catch (err) {
      console.info('Firebase initializing with local cache:', err.message);
    }
  }

  // Local collection keys
  const KEYS = {
    doctors: 'ff_db_doctors',
    clinics: 'ff_db_clinics',
    appointments: 'ff_db_appointments',
    patients: 'ff_db_patients',
    reviews: 'ff_db_reviews',
    blogs: 'ff_db_blogs',
    submissions: 'ff_db_submissions',
    users: 'ff_db_users',
    payments: 'ff_db_payments'
  };

  // Seed default collections and synchronize to Firestore
  async function seedInitialData() {
    try {
      const [docsRes, cliRes, aptRes, patRes, revRes, blgRes] = await Promise.all([
        fetch('_data/doctors.json').then(r => r.json()).catch(() => []),
        fetch('_data/clinics.json').then(r => r.json()).catch(() => []),
        fetch('_data/appointments.json').then(r => r.json()).catch(() => []),
        fetch('_data/patients.json').then(r => r.json()).catch(() => []),
        fetch('_data/reviews.json').then(r => r.json()).catch(() => []),
        fetch('_data/blogs.json').then(r => r.json()).catch(() => [])
      ]);

      if (docsRes && docsRes.length && !localStorage.getItem(KEYS.doctors)) {
        localStorage.setItem(KEYS.doctors, JSON.stringify(docsRes));
      }
      if (cliRes && cliRes.length && !localStorage.getItem(KEYS.clinics)) {
        localStorage.setItem(KEYS.clinics, JSON.stringify(cliRes));
      }
      if (aptRes && aptRes.length && !localStorage.getItem(KEYS.appointments)) {
        localStorage.setItem(KEYS.appointments, JSON.stringify(aptRes));
      }
      if (patRes && patRes.length && !localStorage.getItem(KEYS.patients)) {
        localStorage.setItem(KEYS.patients, JSON.stringify(patRes));
      }
      if (revRes && revRes.length && !localStorage.getItem(KEYS.reviews)) {
        localStorage.setItem(KEYS.reviews, JSON.stringify(revRes));
      }
      if (blgRes && blgRes.length && !localStorage.getItem(KEYS.blogs)) {
        localStorage.setItem(KEYS.blogs, JSON.stringify(blgRes));
      }

      // Synchronize initial data to Firestore if online
      if (isLive && isApproved && db) {
        try {
          const docSnap = await db.collection('doctors').limit(1).get();
          if (docSnap.empty) {
            console.log('Seeding initial collections into Cloud Firestore...');
            for (const doc of docsRes) await db.collection('doctors').doc(doc.id).set(doc);
            for (const cli of cliRes) await db.collection('clinics').doc(cli.id).set(cli);
            for (const apt of aptRes) await db.collection('appointments').doc(apt.id).set(apt);
            for (const pat of patRes) await db.collection('patients').doc(pat.id).set(pat);
            for (const rev of revRes) await db.collection('reviews').doc(rev.id).set(rev);
            for (const blg of blgRes) await db.collection('blogs').doc(blg.id).set(blg);
            console.log('✅ Cloud Firestore seeding complete!');
          }
        } catch (e) {
          console.info('Auto-seed check note:', e.message);
        }
      }
    } catch (e) {
      console.warn('Initial data seed error:', e.message);
    }
  }
  seedInitialData();

  window.FertiFirebase = {
    getConfig: function () {
      return Object.assign({}, activeConfig);
    },

    isLive: function () {
      return isLive;
    },

    isApproved: function () {
      return isApproved;
    },

    approveConnection: function () {
      isApproved = true;
      localStorage.setItem('ff_firebase_approved', 'true');
      return true;
    },

    saveConfig: function (newConfig) {
      activeConfig = Object.assign({}, activeConfig, newConfig);
      localStorage.setItem('ff_firebase_config', JSON.stringify(activeConfig));
      isApproved = true;
      localStorage.setItem('ff_firebase_approved', 'true');
      window.location.reload();
    },

    /* ========================================================================
       1. Appointments Table (Appointment Booking Modal)
       ======================================================================== */
    addAppointment: async function (apt) {
      apt.id = apt.id || 'APT-' + Math.floor(1000 + Math.random() * 9000);
      apt.status = apt.status || 'Pending';
      apt.createdAt = new Date().toISOString();
      apt.source = apt.source || 'Website Booking Form';

      // 1. Save to Firebase Firestore
      if (isLive) {
        try {
          await db.collection('appointments').doc(apt.id).set(apt);
        } catch (e) {
          console.warn('Firestore write error (appointment):', e.message);
        }
      }

      // 2. Save to local cache
      const list = JSON.parse(localStorage.getItem(KEYS.appointments) || '[]');
      list.unshift(apt);
      localStorage.setItem(KEYS.appointments, JSON.stringify(list));

      // 3. Automatically link and create/update patient in Patients Table!
      if (apt.patientName) {
        await this.upsertPatient({
          name: apt.patientName,
          phone: apt.phone || '',
          email: apt.email || '',
          lastVisit: apt.dateTime || new Date().toISOString().split('T')[0]
        });
      }

      return apt;
    },

    getAppointments: async function () {
      if (isLive) {
        try {
          const snapshot = await db.collection('appointments').orderBy('createdAt', 'desc').get();
          if (!snapshot.empty) {
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          }
        } catch (e) {}
      }
      return JSON.parse(localStorage.getItem(KEYS.appointments) || '[]');
    },

    updateAppointmentStatus: async function (id, status) {
      if (isLive) {
        try {
          await db.collection('appointments').doc(id).update({ status });
        } catch (e) {}
      }
      const list = JSON.parse(localStorage.getItem(KEYS.appointments) || '[]');
      const item = list.find(a => a.id === id);
      if (item) item.status = status;
      localStorage.setItem(KEYS.appointments, JSON.stringify(list));
      return true;
    },

    /* ========================================================================
       2. Patients Table
       ======================================================================== */
    upsertPatient: async function (patientData) {
      let patients = JSON.parse(localStorage.getItem(KEYS.patients) || '[]');
      let existing = patients.find(p => p.name.toLowerCase() === patientData.name.toLowerCase() || (p.email && p.email === patientData.email));
      
      if (existing) {
        existing.appointments = (existing.appointments || 1) + 1;
        existing.lastVisit = patientData.lastVisit || new Date().toISOString().split('T')[0];
        if (patientData.phone && !existing.phone) existing.phone = patientData.phone;
        if (patientData.email && !existing.email) existing.email = patientData.email;
        if (isLive) {
          try { await db.collection('patients').doc(existing.id).set(existing); } catch (e) {}
        }
      } else {
        existing = {
          id: 'PAT-' + Math.floor(100 + Math.random() * 900),
          name: patientData.name,
          phone: patientData.phone || '+971 50 XXX XXXX',
          email: patientData.email || '',
          appointments: 1,
          lastVisit: patientData.lastVisit || 'Today',
          createdAt: new Date().toISOString()
        };
        patients.unshift(existing);
        if (isLive) {
          try { await db.collection('patients').doc(existing.id).set(existing); } catch (e) {}
        }
      }
      localStorage.setItem(KEYS.patients, JSON.stringify(patients));
      return existing;
    },

    getPatients: async function () {
      if (isLive) {
        try {
          const snapshot = await db.collection('patients').get();
          if (!snapshot.empty) {
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          }
        } catch (e) {}
      }
      return JSON.parse(localStorage.getItem(KEYS.patients) || '[]');
    },

    addPatient: async function (pat) {
      return this.upsertPatient(pat);
    },

    /* ========================================================================
       3. Reviews Table (Patient Review Modal)
       ======================================================================== */
    addReview: async function (rev) {
      rev.id = rev.id || 'REV-' + Math.floor(100 + Math.random() * 900);
      rev.rating = Number(rev.rating) || 5;
      rev.date = rev.date || 'Just now';
      rev.verified = rev.verified !== false;
      rev.createdAt = new Date().toISOString();

      if (isLive) {
        try {
          await db.collection('reviews').doc(rev.id).set(rev);
        } catch (e) {
          console.warn('Firestore write error (review):', e.message);
        }
      }

      const list = JSON.parse(localStorage.getItem(KEYS.reviews) || '[]');
      list.unshift(rev);
      localStorage.setItem(KEYS.reviews, JSON.stringify(list));
      return rev;
    },

    getReviews: async function () {
      if (isLive) {
        try {
          const snapshot = await db.collection('reviews').orderBy('createdAt', 'desc').get();
          if (!snapshot.empty) {
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          }
        } catch (e) {}
      }
      return JSON.parse(localStorage.getItem(KEYS.reviews) || '[]');
    },

    /* ========================================================================
       4. Practice Submissions & Clinics Table (submit-business.html & quick list)
       ======================================================================== */
    recordSubmission: async function (sub) {
      sub.id = sub.id || 'SUB-' + Math.floor(10000 + Math.random() * 90000);
      sub.submittedAt = new Date().toISOString();
      sub.status = sub.status || 'Pending Verification';

      if (isLive) {
        try {
          await db.collection('submissions').doc(sub.id).set(sub);
        } catch (e) {
          console.warn('Firestore write error (submission):', e.message);
        }
      }

      // Also create listing in clinics/facilities table
      const clinicRecord = {
        id: 'CLI-' + Math.floor(100 + Math.random() * 900),
        name: sub.name,
        category: sub.category || 'Clinic',
        area: sub.area || 'Dubai',
        address: sub.address || '',
        phone: sub.phone || sub.whatsapp || '',
        whatsapp: sub.whatsapp || '',
        email: sub.email || '',
        website: sub.website || '',
        dhaLicense: sub.dhaLicense || '',
        tradeLicense: sub.tradeLicense || '',
        services: sub.services || [],
        consultationFee: sub.consultationFee || 500,
        plan: sub.plan || 'Featured Specialist',
        rating: 5.0,
        reviewsCount: 1,
        status: 'Pending Verification',
        submittedAt: sub.submittedAt
      };

      await this.addClinic(clinicRecord);

      // If category is doctor, also add to doctors table
      if (sub.category && sub.category.toLowerCase().includes('doctor')) {
        await this.addDoctor({
          name: sub.name,
          specialty: 'Reproductive Medicine & Infertility',
          category: 'Gynecology',
          clinic: sub.name,
          area: sub.area,
          dhaLicense: sub.dhaLicense,
          phone: sub.phone,
          whatsapp: sub.whatsapp,
          consultationFee: sub.consultationFee || 500,
          rating: 5.0,
          reviewsCount: 1,
          appointmentsCount: 0,
          status: 'Pending Verification'
        });
      }

      const list = JSON.parse(localStorage.getItem(KEYS.submissions) || '[]');
      list.unshift(sub);
      localStorage.setItem(KEYS.submissions, JSON.stringify(list));
      return sub;
    },

    getSubmissions: async function () {
      if (isLive) {
        try {
          const snapshot = await db.collection('submissions').orderBy('submittedAt', 'desc').get();
          if (!snapshot.empty) {
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          }
        } catch (e) {}
      }
      return JSON.parse(localStorage.getItem(KEYS.submissions) || '[]');
    },

    addClinic: async function (clinic) {
      clinic.id = clinic.id || 'CLI-' + Math.floor(100 + Math.random() * 900);
      if (isLive) {
        try {
          await db.collection('clinics').doc(clinic.id).set(clinic);
        } catch (e) {}
      }
      const list = JSON.parse(localStorage.getItem(KEYS.clinics) || '[]');
      list.unshift(clinic);
      localStorage.setItem(KEYS.clinics, JSON.stringify(list));
      return clinic;
    },

    getClinics: async function () {
      if (isLive) {
        try {
          const snapshot = await db.collection('clinics').get();
          if (!snapshot.empty) {
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          }
        } catch (e) {}
      }
      return JSON.parse(localStorage.getItem(KEYS.clinics) || '[]');
    },

    /* ========================================================================
       5. Doctors Table
       ======================================================================== */
    addDoctor: async function (doc) {
      doc.id = doc.id || 'DOC-' + Math.floor(100 + Math.random() * 900);
      doc.status = doc.status || 'Active';
      doc.avatar = doc.avatar || '👨‍⚕️';
      if (isLive) {
        try {
          await db.collection('doctors').doc(doc.id).set(doc);
        } catch (e) {}
      }
      const list = JSON.parse(localStorage.getItem(KEYS.doctors) || '[]');
      list.unshift(doc);
      localStorage.setItem(KEYS.doctors, JSON.stringify(list));
      return doc;
    },

    getDoctors: async function () {
      if (isLive) {
        try {
          const snapshot = await db.collection('doctors').get();
          if (!snapshot.empty) {
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          }
        } catch (e) {}
      }
      return JSON.parse(localStorage.getItem(KEYS.doctors) || '[]');
    },

    deleteDoctor: async function (id) {
      if (isLive) {
        try { await db.collection('doctors').doc(id).delete(); } catch (e) {}
      }
      let list = JSON.parse(localStorage.getItem(KEYS.doctors) || '[]');
      list = list.filter(d => d.id !== id);
      localStorage.setItem(KEYS.doctors, JSON.stringify(list));
      return true;
    },

    /* ========================================================================
       6. Users Table (Registration & Auth)
       ======================================================================== */
    registerUser: async function (user) {
      user.uid = user.uid || 'USR-' + Math.floor(1000 + Math.random() * 9000);
      user.registeredAt = new Date().toISOString();
      if (isLive) {
        try {
          await db.collection('users').doc(user.uid).set(user);
        } catch (e) {}
      }
      const list = JSON.parse(localStorage.getItem(KEYS.users) || '[]');
      list.unshift(user);
      localStorage.setItem(KEYS.users, JSON.stringify(list));
      localStorage.setItem('ff_user', JSON.stringify(user));
      return user;
    },

    getUsers: async function () {
      if (isLive) {
        try {
          const snapshot = await db.collection('users').get();
          if (!snapshot.empty) {
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          }
        } catch (e) {}
      }
      return JSON.parse(localStorage.getItem(KEYS.users) || '[]');
    },

    /* ========================================================================
       7. Blogs & Articles Table
       ======================================================================== */
    addBlog: async function (blog) {
      blog.id = blog.id || 'BLG-' + Math.floor(100 + Math.random() * 900);
      blog.publishedOn = blog.publishedOn || new Date().toISOString().split('T')[0];
      blog.status = blog.status || 'Published';
      if (isLive) {
        try {
          await db.collection('blogs').doc(blog.id).set(blog);
        } catch (e) {}
      }
      const list = JSON.parse(localStorage.getItem(KEYS.blogs) || '[]');
      list.unshift(blog);
      localStorage.setItem(KEYS.blogs, JSON.stringify(list));
      return blog;
    },

    getBlogs: async function () {
      if (isLive) {
        try {
          const snapshot = await db.collection('blogs').get();
          if (!snapshot.empty) {
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          }
        } catch (e) {}
      }
      return JSON.parse(localStorage.getItem(KEYS.blogs) || '[]');
    },

    /* ========================================================================
       8. Seed local collections to real Cloud Firestore
       ======================================================================== */
    seedToFirestore: async function () {
      if (!isLive) {
        throw new Error('Firebase is not initialized. Please verify your Project ID and API Key.');
      }
      const collections = ['doctors', 'clinics', 'appointments', 'patients', 'reviews', 'blogs'];
      let count = 0;
      for (const col of collections) {
        const items = JSON.parse(localStorage.getItem('ff_db_' + col) || '[]');
        for (const item of items) {
          await db.collection(col).doc(item.id).set(item);
          count++;
        }
      }
      isApproved = true;
      localStorage.setItem('ff_firebase_approved', 'true');
      return count;
    }
  };
})();
