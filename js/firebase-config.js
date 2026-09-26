/**
 * FertiFind Dubai Directory - Google Firebase Firestore Integration
 * Supports live Firebase Firestore database + automatic offline fallback.
 */

(function () {
  // Default configuration or saved custom config from localStorage
  const savedConfig = localStorage.getItem('ff_firebase_config');
  let firebaseConfig = {
    apiKey: "AIzaSyDemoKeyDubaiDoctorsDirectory2026",
    authDomain: "dubaidoctorsdirectory-prod.firebaseapp.com",
    projectId: "dubaidoctorsdirectory-prod",
    storageBucket: "dubaidoctorsdirectory-prod.appspot.com",
    messagingSenderId: "109283746501",
    appId: "1:109283746501:web:9a8b7c6d5e4f3a2b1c0d"
  };

  if (savedConfig) {
    try {
      firebaseConfig = Object.assign(firebaseConfig, JSON.parse(savedConfig));
    } catch (e) {
      console.warn('Could not parse saved Firebase config', e);
    }
  }

  let db = null;
  let isLive = false;

  // Try initializing Firebase if SDK is available
  if (typeof firebase !== 'undefined' && firebase.initializeApp) {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      db = firebase.firestore();
      isLive = true;
      console.log('Google Firebase initialized successfully for project:', firebaseConfig.projectId);
    } catch (err) {
      console.info('Firebase initializing with fallback store:', err.message);
    }
  }

  // Local storage cache keys for collections
  const CACHE_KEYS = {
    doctors: 'ff_db_doctors',
    clinics: 'ff_db_clinics',
    appointments: 'ff_db_appointments',
    patients: 'ff_db_patients',
    reviews: 'ff_db_reviews',
    blogs: 'ff_db_blogs',
    submissions: 'ff_db_submissions',
    payments: 'ff_db_payments'
  };

  // Pre-seed local storage from _data if not already present
  async function initLocalStore() {
    if (!localStorage.getItem(CACHE_KEYS.doctors)) {
      try {
        const [docsRes, cliRes, aptRes, patRes, revRes, blgRes] = await Promise.all([
          fetch('_data/doctors.json').then(r => r.json()),
          fetch('_data/clinics.json').then(r => r.json()),
          fetch('_data/appointments.json').then(r => r.json()),
          fetch('_data/patients.json').then(r => r.json()),
          fetch('_data/reviews.json').then(r => r.json()),
          fetch('_data/blogs.json').then(r => r.json())
        ]);
        localStorage.setItem(CACHE_KEYS.doctors, JSON.stringify(docsRes));
        localStorage.setItem(CACHE_KEYS.clinics, JSON.stringify(cliRes));
        localStorage.setItem(CACHE_KEYS.appointments, JSON.stringify(aptRes));
        localStorage.setItem(CACHE_KEYS.patients, JSON.stringify(patRes));
        localStorage.setItem(CACHE_KEYS.reviews, JSON.stringify(revRes));
        localStorage.setItem(CACHE_KEYS.blogs, JSON.stringify(blgRes));
      } catch (e) {
        console.warn('Initial _data fetch skipped:', e.message);
      }
    }
  }
  initLocalStore();

  window.FertiFirebase = {
    getConfig: function () {
      return Object.assign({}, firebaseConfig);
    },

    saveConfig: function (newConfig) {
      localStorage.setItem('ff_firebase_config', JSON.stringify(newConfig));
      window.location.reload();
    },

    isLive: function () {
      return isLive;
    },

    // Doctors CRUD
    getDoctors: async function () {
      if (isLive) {
        try {
          const snapshot = await db.collection('doctors').get();
          if (!snapshot.empty) {
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          }
        } catch (e) {
          console.warn('Firestore fallback on doctors:', e);
        }
      }
      return JSON.parse(localStorage.getItem(CACHE_KEYS.doctors) || '[]');
    },

    addDoctor: async function (doctor) {
      doctor.id = doctor.id || 'DOC-' + Math.floor(100 + Math.random() * 900);
      if (isLive) {
        try {
          await db.collection('doctors').doc(doctor.id).set(doctor);
        } catch (e) {
          console.warn('Firestore save error:', e);
        }
      }
      const list = JSON.parse(localStorage.getItem(CACHE_KEYS.doctors) || '[]');
      list.unshift(doctor);
      localStorage.setItem(CACHE_KEYS.doctors, JSON.stringify(list));
      return doctor;
    },

    deleteDoctor: async function (id) {
      if (isLive) {
        try { await db.collection('doctors').doc(id).delete(); } catch (e) {}
      }
      let list = JSON.parse(localStorage.getItem(CACHE_KEYS.doctors) || '[]');
      list = list.filter(d => d.id !== id);
      localStorage.setItem(CACHE_KEYS.doctors, JSON.stringify(list));
      return true;
    },

    // Clinics & Listings CRUD
    getClinics: async function () {
      if (isLive) {
        try {
          const snapshot = await db.collection('clinics').get();
          if (!snapshot.empty) {
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          }
        } catch (e) {}
      }
      return JSON.parse(localStorage.getItem(CACHE_KEYS.clinics) || '[]');
    },

    addClinic: async function (clinic) {
      clinic.id = clinic.id || 'CLI-' + Math.floor(100 + Math.random() * 900);
      if (isLive) {
        try {
          await db.collection('clinics').doc(clinic.id).set(clinic);
        } catch (e) {}
      }
      const list = JSON.parse(localStorage.getItem(CACHE_KEYS.clinics) || '[]');
      list.unshift(clinic);
      localStorage.setItem(CACHE_KEYS.clinics, JSON.stringify(list));
      return clinic;
    },

    // Appointments CRUD
    getAppointments: async function () {
      if (isLive) {
        try {
          const snapshot = await db.collection('appointments').orderBy('dateTime', 'desc').get();
          if (!snapshot.empty) {
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          }
        } catch (e) {}
      }
      return JSON.parse(localStorage.getItem(CACHE_KEYS.appointments) || '[]');
    },

    addAppointment: async function (apt) {
      apt.id = apt.id || 'APT-' + Math.floor(1000 + Math.random() * 9000);
      apt.status = apt.status || 'Pending';
      apt.createdAt = new Date().toISOString();
      if (isLive) {
        try {
          await db.collection('appointments').doc(apt.id).set(apt);
        } catch (e) {}
      }
      const list = JSON.parse(localStorage.getItem(CACHE_KEYS.appointments) || '[]');
      list.unshift(apt);
      localStorage.setItem(CACHE_KEYS.appointments, JSON.stringify(list));
      return apt;
    },

    updateAppointmentStatus: async function (id, status) {
      if (isLive) {
        try {
          await db.collection('appointments').doc(id).update({ status });
        } catch (e) {}
      }
      const list = JSON.parse(localStorage.getItem(CACHE_KEYS.appointments) || '[]');
      const item = list.find(a => a.id === id);
      if (item) item.status = status;
      localStorage.setItem(CACHE_KEYS.appointments, JSON.stringify(list));
      return true;
    },

    // Patients CRUD
    getPatients: async function () {
      if (isLive) {
        try {
          const snapshot = await db.collection('patients').get();
          if (!snapshot.empty) {
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          }
        } catch (e) {}
      }
      return JSON.parse(localStorage.getItem(CACHE_KEYS.patients) || '[]');
    },

    addPatient: async function (pat) {
      pat.id = pat.id || 'PAT-' + Math.floor(100 + Math.random() * 900);
      if (isLive) {
        try {
          await db.collection('patients').doc(pat.id).set(pat);
        } catch (e) {}
      }
      const list = JSON.parse(localStorage.getItem(CACHE_KEYS.patients) || '[]');
      list.unshift(pat);
      localStorage.setItem(CACHE_KEYS.patients, JSON.stringify(list));
      return pat;
    },

    // Reviews CRUD
    getReviews: async function () {
      if (isLive) {
        try {
          const snapshot = await db.collection('reviews').get();
          if (!snapshot.empty) {
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          }
        } catch (e) {}
      }
      return JSON.parse(localStorage.getItem(CACHE_KEYS.reviews) || '[]');
    },

    addReview: async function (rev) {
      rev.id = rev.id || 'REV-' + Math.floor(100 + Math.random() * 900);
      rev.date = rev.date || 'Just now';
      if (isLive) {
        try {
          await db.collection('reviews').doc(rev.id).set(rev);
        } catch (e) {}
      }
      const list = JSON.parse(localStorage.getItem(CACHE_KEYS.reviews) || '[]');
      list.unshift(rev);
      localStorage.setItem(CACHE_KEYS.reviews, JSON.stringify(list));
      return rev;
    },

    // Blogs CRUD
    getBlogs: async function () {
      if (isLive) {
        try {
          const snapshot = await db.collection('blogs').get();
          if (!snapshot.empty) {
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          }
        } catch (e) {}
      }
      return JSON.parse(localStorage.getItem(CACHE_KEYS.blogs) || '[]');
    },

    addBlog: async function (blog) {
      blog.id = blog.id || 'BLG-' + Math.floor(100 + Math.random() * 900);
      blog.publishedOn = blog.publishedOn || new Date().toISOString().split('T')[0];
      blog.status = blog.status || 'Published';
      if (isLive) {
        try {
          await db.collection('blogs').doc(blog.id).set(blog);
        } catch (e) {}
      }
      const list = JSON.parse(localStorage.getItem(CACHE_KEYS.blogs) || '[]');
      list.unshift(blog);
      localStorage.setItem(CACHE_KEYS.blogs, JSON.stringify(list));
      return blog;
    },

    // Practice Submissions (from submit-business.html)
    recordSubmission: async function (submission) {
      submission.id = submission.id || 'SUB-' + Math.floor(10000 + Math.random() * 90000);
      submission.submittedAt = new Date().toISOString();
      if (isLive) {
        try {
          await db.collection('submissions').doc(submission.id).set(submission);
        } catch (e) {
          console.warn('Firestore submission save error:', e);
        }
      }
      const list = JSON.parse(localStorage.getItem(CACHE_KEYS.submissions) || '[]');
      list.unshift(submission);
      localStorage.setItem(CACHE_KEYS.submissions, JSON.stringify(list));
      return submission;
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
      return JSON.parse(localStorage.getItem(CACHE_KEYS.submissions) || '[]');
    },

    // Seed local cache to real Firestore
    seedToFirestore: async function () {
      if (!isLive) {
        throw new Error('Firebase is not initialized. Please verify your Firebase project credentials in Settings.');
      }
      const collections = ['doctors', 'clinics', 'appointments', 'patients', 'reviews', 'blogs'];
      let total = 0;
      for (const col of collections) {
        const items = JSON.parse(localStorage.getItem('ff_db_' + col) || '[]');
        for (const item of items) {
          await db.collection(col).doc(item.id).set(item);
          total++;
        }
      }
      return total;
    }
  };
})();
