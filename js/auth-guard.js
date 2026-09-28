/**
 * Doctors Directory Dubai - Enterprise Authentication & Role Guard System
 * Controls role-based access control (RBAC) across all 4 platform roles:
 * 1. Super Admin ('admin')
 * 2. Hospitals & Clinics ('hospital' / 'clinic')
 * 3. Doctors & Specialists ('doctor')
 * 4. Patients & Families ('patient')
 */

(function (window) {
  'use strict';

  const STORAGE_KEYS = {
    session: 'ff_auth_session',
    user: 'ff_user',
    usersDb: 'ff_db_users'
  };

  const DEFAULT_SEED_USERS = [
    {
      "id": "USR-ADMIN-001",
      "name": "Platform Super Admin",
      "email": "admin@dubaidoctorsdirectory.ae",
      "password": "Admin2026!",
      "role": "admin",
      "phone": "+971 4 300 0001",
      "status": "Active",
      "registeredAt": "2025-01-01T00:00:00.000Z",
      "permissions": ["all"]
    },
    {
      "id": "USR-HOSP-001",
      "name": "King's College Hospital Dubai",
      "email": "admin@kingscollegehospital.ae",
      "password": "Hospital2026!",
      "role": "hospital",
      "facility": "King's College Hospital Dubai (Dubai Hills & Marina)",
      "dhaLicense": "DHA-H-0008819",
      "phone": "+971 4 519 9999",
      "status": "Verified",
      "registeredAt": "2025-01-10T08:00:00.000Z"
    },
    {
      "id": "USR-HOSP-002",
      "name": "American Hospital Dubai",
      "email": "contact@ahdubai.com",
      "password": "Hospital2026!",
      "role": "hospital",
      "facility": "American Hospital Dubai (Oud Metha)",
      "dhaLicense": "DHA-H-0001004",
      "phone": "+971 4 377 5500",
      "status": "Verified",
      "registeredAt": "2025-01-12T09:30:00.000Z"
    },
    {
      "id": "USR-HOSP-003",
      "name": "Orchid Fertility Clinic",
      "email": "info@orchid-fertility.com",
      "password": "Hospital2026!",
      "role": "hospital",
      "facility": "Orchid Fertility Clinic (Dubai Healthcare City)",
      "dhaLicense": "DHA-F-0038912",
      "phone": "+971 4 437 7520",
      "status": "Verified",
      "registeredAt": "2025-01-15T11:00:00.000Z"
    },
    {
      "id": "USR-HOSP-004",
      "name": "First IVF Day Surgery Center",
      "email": "care@firstivf.ae",
      "password": "Hospital2026!",
      "role": "hospital",
      "facility": "First IVF Day Surgery Center (Jumeirah)",
      "dhaLicense": "DHA-F-0041289",
      "phone": "+971 4 700 8900",
      "status": "Verified",
      "registeredAt": "2025-01-18T10:15:00.000Z"
    },
    {
      "id": "USR-HOSP-005",
      "name": "Fakih IVF Fertility Center",
      "email": "info@fakihivf.com",
      "password": "Hospital2026!",
      "role": "hospital",
      "facility": "Fakih IVF Fertility Center (Downtown Dubai)",
      "dhaLicense": "DHA-F-0029481",
      "phone": "+971 4 349 7600",
      "status": "Verified",
      "registeredAt": "2025-01-20T14:00:00.000Z"
    },
    {
      "id": "USR-HOSP-006",
      "name": "Igenomix Dubai Genetics Laboratory",
      "email": "middle.east@igenomix.com",
      "password": "Hospital2026!",
      "role": "hospital",
      "facility": "Igenomix Dubai Genetics Laboratory (DHCC)",
      "dhaLicense": "DHA-L-0081293",
      "phone": "+971 4 437 0820",
      "status": "Verified",
      "registeredAt": "2025-01-22T16:45:00.000Z"
    },
    {
      "id": "USR-DOC-001",
      "name": "Dr. Ahmed Khan",
      "email": "dr.ahmed.khan@ahdubai.com",
      "password": "Doctor2026!",
      "role": "doctor",
      "specialty": "Cardiologist",
      "facility": "American Hospital Dubai",
      "dhaLicense": "DHA-P-0019284",
      "phone": "+971 4 377 5500",
      "status": "Verified",
      "registeredAt": "2025-01-05T08:30:00.000Z"
    },
    {
      "id": "USR-DOC-002",
      "name": "Dr. Sara Al Maktoum",
      "email": "dr.sara@orchid-fertility.com",
      "password": "Doctor2026!",
      "role": "doctor",
      "specialty": "Reproductive Endocrinologist & IVF",
      "facility": "Orchid Fertility Clinic",
      "dhaLicense": "DHA-P-0028193",
      "phone": "+971 4 437 7520",
      "status": "Verified",
      "registeredAt": "2025-01-08T09:00:00.000Z"
    },
    {
      "id": "USR-DOC-003",
      "name": "Dr. Michael Chen",
      "email": "dr.chen@firstivf.ae",
      "password": "Doctor2026!",
      "role": "doctor",
      "specialty": "Dermatologist & Cosmetic Specialist",
      "facility": "First IVF & Medical Surgery Center",
      "dhaLicense": "DHA-P-0034918",
      "phone": "+971 4 700 8900",
      "status": "Verified",
      "registeredAt": "2025-01-11T12:00:00.000Z"
    },
    {
      "id": "USR-DOC-004",
      "name": "Dr. Fatima Zahra",
      "email": "dr.fatima@fakihivf.com",
      "password": "Doctor2026!",
      "role": "doctor",
      "specialty": "Obstetrician & Gynecologist",
      "facility": "Fakih IVF Fertility Center",
      "dhaLicense": "DHA-P-0048192",
      "phone": "+971 4 349 7600",
      "status": "Verified",
      "registeredAt": "2025-01-14T10:30:00.000Z"
    },
    {
      "id": "USR-DOC-005",
      "name": "Dr. Tariq Mansoor",
      "email": "dr.tariq@mediclinic.ae",
      "password": "Doctor2026!",
      "role": "doctor",
      "specialty": "Orthopedic Surgeon",
      "facility": "Mediclinic City Hospital",
      "dhaLicense": "DHA-P-0056193",
      "phone": "+971 4 435 9999",
      "status": "Verified",
      "registeredAt": "2025-01-16T15:00:00.000Z"
    },
    {
      "id": "USR-DOC-006",
      "name": "Dr. Layla Rostami",
      "email": "dr.layla@emirateshospital.ae",
      "password": "Doctor2026!",
      "role": "doctor",
      "specialty": "Pediatric Specialist",
      "facility": "Emirates Hospital Jumeirah",
      "dhaLicense": "DHA-P-0061294",
      "phone": "+971 4 349 6666",
      "status": "Verified",
      "registeredAt": "2025-01-19T11:45:00.000Z"
    },
    {
      "id": "USR-DOC-007",
      "name": "Dr. Omar Al Nuaimi",
      "email": "dr.omar@artfertility.com",
      "password": "Doctor2026!",
      "role": "doctor",
      "specialty": "Urologist & Male Fertility Specialist",
      "facility": "ART Fertility Clinics Dubai",
      "dhaLicense": "DHA-P-0078912",
      "phone": "+971 4 380 9900",
      "status": "Verified",
      "registeredAt": "2025-01-21T13:20:00.000Z"
    },
    {
      "id": "USR-PAT-001",
      "name": "Sarah Johnson",
      "email": "sarah.johnson@example.ae",
      "password": "Patient2026!",
      "role": "patient",
      "emiratesId": "784-1988-1234567-1",
      "dhaId": "DXB-PAT-881920",
      "phone": "+971 50 123 4567",
      "status": "Verified",
      "registeredAt": "2025-01-02T10:00:00.000Z"
    },
    {
      "id": "USR-PAT-002",
      "name": "Mariam Al Hashemi",
      "email": "mariam.hashemi@gmail.com",
      "password": "Patient2026!",
      "role": "patient",
      "emiratesId": "784-1992-8765432-1",
      "dhaId": "DXB-PAT-772819",
      "phone": "+971 50 123 4567",
      "status": "Verified",
      "registeredAt": "2025-01-03T11:15:00.000Z"
    },
    {
      "id": "USR-PAT-003",
      "name": "Johnathan Edwards",
      "email": "j.edwards@outlook.com",
      "password": "Patient2026!",
      "role": "patient",
      "emiratesId": "784-1985-3344556-2",
      "dhaId": "DXB-PAT-661928",
      "phone": "+971 52 987 6543",
      "status": "Verified",
      "registeredAt": "2025-01-07T14:30:00.000Z"
    },
    {
      "id": "USR-PAT-004",
      "name": "Fatima Al Mansoori",
      "email": "f.mansoori@gmail.com",
      "password": "Patient2026!",
      "role": "patient",
      "emiratesId": "784-1990-9988776-3",
      "dhaId": "DXB-PAT-553819",
      "phone": "+971 55 456 7890",
      "status": "Verified",
      "registeredAt": "2025-01-09T16:00:00.000Z"
    },
    {
      "id": "USR-PAT-005",
      "name": "Alexander Petrov",
      "email": "alex.petrov@yahoo.com",
      "password": "Patient2026!",
      "role": "patient",
      "emiratesId": "784-1983-4455667-4",
      "dhaId": "DXB-PAT-442918",
      "phone": "+971 54 321 0987",
      "status": "Verified",
      "registeredAt": "2025-01-13T17:20:00.000Z"
    }
  ];

  // Seed user database synchronously if empty
  function seedUsers() {
    let currentUsers = [];
    try {
      currentUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.usersDb) || '[]');
    } catch (e) {
      currentUsers = [];
    }

    if (!Array.isArray(currentUsers) || currentUsers.length === 0) {
      currentUsers = DEFAULT_SEED_USERS;
      try {
        localStorage.setItem(STORAGE_KEYS.usersDb, JSON.stringify(currentUsers));
      } catch (err) {
        console.warn('LocalStorage save error:', err);
      }
    }
    return currentUsers;
  }

  // Initialize seed immediately
  seedUsers();

  const AuthGuard = {
    // Get all registered users
    getUsers: function () {
      try {
        const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.usersDb) || '[]');
        return Array.isArray(list) ? list : [];
      } catch (e) {
        return [];
      }
    },

    // Get live user counts per role
    getRegisteredCounts: function () {
      const users = this.getUsers();
      const counts = {
        total: users.length,
        admin: 0,
        hospital: 0,
        doctor: 0,
        patient: 0
      };
      users.forEach(u => {
        if (u.role === 'admin') counts.admin++;
        else if (u.role === 'hospital' || u.role === 'clinic') counts.hospital++;
        else if (u.role === 'doctor') counts.doctor++;
        else if (u.role === 'patient') counts.patient++;
      });
      return counts;
    },

    // Authenticate user with credentials
    login: async function (identifier, password) {
      await seedUsers();
      const users = this.getUsers();
      const cleanId = (identifier || '').trim().toLowerCase();
      const cleanPass = (password || '').trim();

      if (!cleanId || !cleanPass) {
        return { success: false, error: 'Please enter your email and password.' };
      }

      // Find user by email or phone
      const found = users.find(u => 
        (u.email && u.email.toLowerCase() === cleanId) || 
        (u.phone && u.phone.replace(/\s+/g, '') === cleanId.replace(/\s+/g, ''))
      );

      if (!found) {
        return { 
          success: false, 
          error: 'No registered account found with that email or phone number. Please check your credentials or register.' 
        };
      }

      // Verify password
      if (found.password && found.password !== cleanPass) {
        return { 
          success: false, 
          error: 'Incorrect password entered. Please try again or use Forgot Password.' 
        };
      }

      // Generate session
      const session = {
        user: found,
        token: 'tk_' + Math.random().toString(36).substr(2) + Date.now(),
        loginTime: new Date().toISOString()
      };

      localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(found));

      return { success: true, user: found };
    },

    // Register a new user
    register: async function (userData) {
      await seedUsers();
      const users = this.getUsers();
      const cleanEmail = (userData.email || '').trim().toLowerCase();

      // Check duplicate email
      if (cleanEmail && users.some(u => u.email && u.email.toLowerCase() === cleanEmail)) {
        return { success: false, error: 'An account with this email address already exists. Please log in.' };
      }

      const role = userData.role || 'patient';
      const newUser = {
        id: 'USR-' + role.toUpperCase().substring(0, 4) + '-' + Math.floor(1000 + Math.random() * 9000),
        name: userData.name || userData.full_name || 'Verified User',
        email: cleanEmail,
        password: userData.password || 'Dubai2026!',
        role: role,
        phone: userData.phone || userData.mobile || '+971 50 000 0000',
        status: (role === 'admin' || role === 'patient') ? 'Active' : 'Pending Verification',
        registeredAt: new Date().toISOString()
      };

      if (role === 'hospital' || role === 'clinic') {
        newUser.facility = newUser.name;
        newUser.dhaLicense = userData.dhaLicense || 'DHA-F-PENDING';
      } else if (role === 'doctor') {
        newUser.specialty = userData.specialty || 'General Practitioner';
        newUser.dhaLicense = userData.dhaLicense || 'DHA-P-PENDING';
      }

      users.unshift(newUser);
      localStorage.setItem(STORAGE_KEYS.usersDb, JSON.stringify(users));

      // Auto login
      const session = {
        user: newUser,
        token: 'tk_' + Math.random().toString(36).substr(2) + Date.now(),
        loginTime: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(newUser));

      return { success: true, user: newUser };
    },

    // Get current authenticated user
    getCurrentUser: function () {
      try {
        const sessionStr = localStorage.getItem(STORAGE_KEYS.session);
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          if (session && session.user) return session.user;
        }
        const userStr = localStorage.getItem(STORAGE_KEYS.user);
        if (userStr) {
          return JSON.parse(userStr);
        }
      } catch (e) {
        return null;
      }
      return null;
    },

    // Sign out
    logout: function (redirectUrl) {
      localStorage.removeItem(STORAGE_KEYS.session);
      localStorage.removeItem(STORAGE_KEYS.user);
      window.location.href = redirectUrl || 'auth.html';
    },

    // Protect a dashboard route: Enforces authentication and specific role authorization
    protect: function (requiredRole) {
      const user = this.getCurrentUser();
      const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';

      // 1. If not logged in at all -> redirect to login immediately
      if (!user) {
        console.warn(`[AuthGuard] Access denied: User not authenticated for ${currentPage}`);
        window.location.href = `auth.html?redirect=${encodeURIComponent(currentPage)}&required_role=${encodeURIComponent(requiredRole)}&error=unauthenticated`;
        return null;
      }

      // 2. Role matching check
      const userRole = (user.role || '').toLowerCase();
      const reqRole = (requiredRole || '').toLowerCase();

      let authorized = false;
      if (reqRole === 'admin' && userRole === 'admin') {
        authorized = true;
      } else if (reqRole === 'hospital' && (userRole === 'hospital' || userRole === 'clinic' || userRole === 'admin')) {
        authorized = true;
      } else if (reqRole === 'doctor' && (userRole === 'doctor' || userRole === 'admin')) {
        authorized = true;
      } else if (reqRole === 'patient' && (userRole === 'patient' || userRole === 'admin')) {
        authorized = true;
      }

      // 3. If role mismatch -> redirect to user's authorized portal
      if (!authorized) {
        console.warn(`[AuthGuard] Access denied: User role "${userRole}" cannot access "${reqRole}" portal.`);
        let userPortal = 'auth.html';
        if (userRole === 'admin') userPortal = 'admin.html';
        else if (userRole === 'hospital' || userRole === 'clinic') userPortal = 'dashboard-hospital.html';
        else if (userRole === 'doctor') userPortal = 'dashboard-doctor.html';
        else if (userRole === 'patient') userPortal = 'dashboard-patient.html';

        alert(`Access Restricted: You are currently signed in as a ${userRole.toUpperCase()} (${user.name}). You do not have permission to view the ${reqRole.toUpperCase()} portal. Redirecting to your assigned dashboard.`);
        window.location.href = userPortal;
        return null;
      }

      // 4. Authorized: update UI elements with user data
      this.populateUserUI(user);
      return user;
    },

    // Automatically inject user name, avatar, and metadata into DOM
    populateUserUI: function (user) {
      document.addEventListener('DOMContentLoaded', () => {
        const nameEls = document.querySelectorAll('.auth-user-name, .admin-meta b');
        nameEls.forEach(el => { el.textContent = user.name || 'Verified User'; });

        const subEls = document.querySelectorAll('.auth-user-role, .admin-meta small');
        subEls.forEach(el => { 
          if (user.role === 'admin') el.textContent = 'Platform Super Admin';
          else if (user.role === 'hospital' || user.role === 'clinic') el.textContent = user.facility || 'Facility Director';
          else if (user.role === 'doctor') el.textContent = user.specialty ? `Consultant ${user.specialty}` : 'Specialist Physician';
          else if (user.role === 'patient') el.textContent = user.dhaId ? `DHA #${user.dhaId}` : 'Verified Patient';
        });

        const welcomeEls = document.querySelectorAll('.auth-welcome-name');
        welcomeEls.forEach(el => { el.textContent = user.name || 'User'; });
      });
    }
  };

  window.AuthGuard = AuthGuard;
})(window);
