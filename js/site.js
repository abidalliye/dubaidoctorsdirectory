/**
 * FertiFind Dubai - Site Controller
 * Connects cross-page navigation, live search routing, booking/review modals,
 * and mobile navigation drawers across the website.
 */

(function () {
  'use strict';

  function initGlobalModals() {
    if (document.getElementById('ffGlobalModalsContainer')) return;

    const modalContainer = document.createElement('div');
    modalContainer.id = 'ffGlobalModalsContainer';
    modalContainer.innerHTML = `
      <!-- Booking Modal -->
      <div class="ff-modal" id="ffBookingModal">
        <div class="ff-modal-box">
          <div class="ff-modal-head">
            <div>
              <h3 id="ffBookingTitle" style="color:var(--navy);font-size:20px;margin:0">Book an Appointment</h3>
              <p id="ffBookingSubtitle" style="color:var(--muted);font-size:13px;margin:4px 0 0">Verified fertility care navigation across Dubai</p>
            </div>
            <button class="ff-close" onclick="FertiFind.closeModal('ffBookingModal')" aria-label="Close">✕</button>
          </div>
          <form class="ff-form" id="ffBookingForm">
            <div>
              <label>Provider / Facility</label>
              <input type="text" id="ffBookingProvider" readonly style="background:#f7f9fc;font-weight:700">
            </div>
            <div>
              <label>Service or Consultation Type</label>
              <select id="ffBookingService" required>
                <option value="Initial IVF / Fertility Consultation">Initial IVF / Fertility Consultation</option>
                <option value="Video / Zoom Tele-Consultation">Video / Zoom Tele-Consultation</option>
                <option value="Semen Analysis & Andrology">Semen Analysis & Andrology</option>
                <option value="AMH & Reproductive Hormone Blood Panel">AMH & Reproductive Hormone Blood Panel</option>
                <option value="Egg Freezing Assessment">Egg Freezing Assessment</option>
                <option value="Home Sample Phlebotomy Collection">Home Sample Phlebotomy Collection</option>
              </select>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <div>
                <label>Full Name</label>
                <input type="text" required placeholder="e.g. Fatima Al Mansoori">
              </div>
              <div>
                <label>Mobile Number (+971)</label>
                <input type="tel" required placeholder="+971 50 XXX XXXX">
              </div>
            </div>
            <div>
              <label>Email Address</label>
              <input type="email" required placeholder="name@example.com">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <div>
                <label>Preferred Date</label>
                <input type="date" required id="ffBookingDate">
              </div>
              <div>
                <label>Preferred Slot</label>
                <select>
                  <option>Morning (09:00 AM – 12:00 PM)</option>
                  <option>Afternoon (12:00 PM – 04:00 PM)</option>
                  <option>Evening (04:00 PM – 08:00 PM)</option>
                </select>
              </div>
            </div>
            <div>
              <label>Clinical Notes or Prior History (Optional)</label>
              <textarea placeholder="Describe previous cycles, test results, or specific questions for the doctor..."></textarea>
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;margin-top:6px;padding:13px">Confirm Booking Request →</button>
            <p style="font-size:11px;color:var(--muted);text-align:center;margin:6px 0 0">
              🔒 Direct coordination with DHA-licensed clinic. No booking surcharge.
            </p>
          </form>
        </div>
      </div>

      <!-- Write Review Modal -->
      <div class="ff-modal" id="ffReviewModal">
        <div class="ff-modal-box">
          <div class="ff-modal-head">
            <div>
              <h3 id="ffReviewTitle" style="color:var(--navy);font-size:20px;margin:0">Write a Patient Review</h3>
              <p id="ffReviewSubtitle" style="color:var(--muted);font-size:13px;margin:4px 0 0">Share your verified healthcare experience in Dubai</p>
            </div>
            <button class="ff-close" onclick="FertiFind.closeModal('ffReviewModal')" aria-label="Close">✕</button>
          </div>
          <form class="ff-form" id="ffReviewForm">
            <div>
              <label>Reviewing Provider</label>
              <input type="text" id="ffReviewProvider" readonly style="background:#f7f9fc;font-weight:700">
            </div>
            <div>
              <label>Overall Experience Rating</label>
              <div style="display:flex;gap:8px;font-size:26px;color:#f2ad2e;cursor:pointer;margin:4px 0" id="ffStarSelector">
                <span data-star="1">★</span><span data-star="2">★</span><span data-star="3">★</span><span data-star="4">★</span><span data-star="5">★</span>
              </div>
              <input type="hidden" id="ffRatingValue" value="5">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <div>
                <label>Your Display Name</label>
                <input type="text" required placeholder="e.g. Mariam K. (or Verified Patient)">
              </div>
              <div>
                <label>Treatment Received</label>
                <select>
                  <option>IVF / ICSI Treatment</option>
                  <option>Fertility Assessment Consultation</option>
                  <option>Semen Analysis / Andrology</option>
                  <option>Egg Freezing Preservation</option>
                  <option>Diagnostic Blood Tests</option>
                </select>
              </div>
            </div>
            <div>
              <label>Your Review</label>
              <textarea required placeholder="Detail the doctor's communication, waiting times, lab explanations, and overall care..."></textarea>
            </div>
            <label style="display:flex;gap:8px;align-items:center;font-size:12px;cursor:pointer">
              <input type="checkbox" required checked>
              <span>I confirm this review represents a genuine patient experience.</span>
            </label>
            <button type="submit" class="btn btn-primary" style="width:100%;margin-top:6px;padding:13px">Submit Verified Review →</button>
          </form>
        </div>
      </div>

      <!-- List Business Modal -->
      <div class="ff-modal" id="ffListBusinessModal">
        <div class="ff-modal-box">
          <div class="ff-modal-head">
            <div>
              <h3 style="color:var(--navy);font-size:20px;margin:0">List or Claim Your Practice</h3>
              <p style="color:var(--muted);font-size:13px;margin:4px 0 0">Join Dubai's verified fertility & reproductive care directory</p>
            </div>
            <button class="ff-close" onclick="FertiFind.closeModal('ffListBusinessModal')" aria-label="Close">✕</button>
          </div>
          <form class="ff-form" id="ffListForm">
            <div>
              <label>Medical Practice / Doctor Name</label>
              <input type="text" required placeholder="e.g. Orchid Fertility Clinic or Dr. Name">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <div>
                <label>Provider Type</label>
                <select required>
                  <option value="clinic">Fertility / IVF Clinic</option>
                  <option value="doctor">Consultant Specialist</option>
                  <option value="hospital">Women's / Multispecialty Hospital</option>
                  <option value="lab">Diagnostic / Genetics Laboratory</option>
                </select>
              </div>
              <div>
                <label>Dubai District</label>
                <select required>
                  <option>Dubai Healthcare City</option>
                  <option>Jumeirah</option>
                  <option>Oud Metha</option>
                  <option>Dubai Marina</option>
                  <option>JLT</option>
                  <option>Al Barsha</option>
                  <option>Downtown Dubai</option>
                  <option>Deira</option>
                </select>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <div>
                <label>DHA License Number</label>
                <input type="text" required placeholder="DHA-XXXX-XXXX">
              </div>
              <div>
                <label>Official Phone Number</label>
                <input type="tel" required placeholder="+971 4 XXX XXXX">
              </div>
            </div>
            <div>
              <label>Official Practice Email</label>
              <input type="email" required placeholder="contact@clinic.ae">
            </div>
            <div>
              <label>Key Services Offered</label>
              <textarea placeholder="e.g. IVF, ICSI, PGT-A, Laparoscopy, TESA, Semen Analysis, Egg Freezing..."></textarea>
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;margin-top:6px;padding:13px">Submit for DHA Verification →</button>
          </form>
        </div>
      </div>

      <!-- Info Modal -->
      <div class="ff-modal" id="ffInfoModal">
        <div class="ff-modal-box">
          <div class="ff-modal-head">
            <div>
              <h3 id="ffInfoTitle" style="color:var(--navy);margin:0">Information</h3>
              <p id="ffInfoSubtitle" style="color:var(--muted);font-size:12px;margin:3px 0 0">FertiFind Directory Information</p>
            </div>
            <button class="ff-close" onclick="FertiFind.closeModal('ffInfoModal')" aria-label="Close">✕</button>
          </div>
          <div id="ffInfoContent" style="font-size:14px;color:var(--ink);line-height:1.6;margin-bottom:18px"></div>
          <button class="btn btn-outline" style="width:100%" onclick="FertiFind.closeModal('ffInfoModal')">Close Window</button>
        </div>
      </div>

      <!-- Auth Modal (Login / Register / Forgot Password) -->
      <div class="ff-modal" id="ffAuthModal">
        <div class="ff-modal-box" style="max-width:500px">
          <div class="ff-modal-head" style="margin-bottom:12px">
            <div>
              <h3 id="ffAuthMainTitle" style="color:var(--navy);font-size:20px;margin:0">FertiFind Account</h3>
              <p id="ffAuthMainSubtitle" style="color:var(--muted);font-size:12px;margin:3px 0 0">Access patient portal or provider practice dashboard</p>
            </div>
            <button class="ff-close" onclick="FertiFind.closeModal('ffAuthModal')" aria-label="Close">✕</button>
          </div>

          <!-- Auth Tab Switcher -->
          <div class="auth-tabs">
            <button type="button" class="auth-tab active" id="ffAuthTabLogin" onclick="FertiFind.switchAuthTab('login')">Log In</button>
            <button type="button" class="auth-tab" id="ffAuthTabRegister" onclick="FertiFind.switchAuthTab('register')">Create Account</button>
            <button type="button" class="auth-tab" id="ffAuthTabForgot" onclick="FertiFind.switchAuthTab('forgot')">Forgot Password</button>
          </div>

          <!-- View 1: Log In -->
          <div class="auth-view active" id="ffAuthViewLogin">
            <form class="ff-form" id="ffLoginForm" onsubmit="FertiFind.submitLogin(event)">
              <div>
                <label>Email Address or Mobile Number</label>
                <input type="text" id="ffLoginEmail" required placeholder="doctor@clinic.ae or patient@example.com">
              </div>
              <div>
                <label>Password</label>
                <div class="input-pass-wrap">
                  <input type="password" id="ffLoginPass" required placeholder="••••••••">
                  <button type="button" class="pass-toggle-btn" onclick="FertiFind.togglePassVisibility('ffLoginPass', this)" aria-label="Toggle password visibility">👁</button>
                </div>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;margin:2px 0">
                <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-weight:600;color:var(--muted)">
                  <input type="checkbox" checked style="width:14px;height:14px;margin:0"> Remember me
                </label>
                <a href="javascript:void(0)" onclick="FertiFind.switchAuthTab('forgot')" style="color:var(--blue);font-weight:700">Forgot Password?</a>
              </div>
              <button type="submit" class="btn btn-primary" style="width:100%;padding:12px">Log In to Account →</button>

              <div class="demo-auth-strip">
                <span>Quick Access:</span>
                <button type="button" class="btn btn-outline btn-xs" onclick="FertiFind.demoLogin('doctor')">🩺 Demo Doctor</button>
                <a href="admin.html" class="btn btn-outline btn-xs" style="color:var(--blue);text-decoration:none">⚡ Admin Dashboard</a>
              </div>

              <p style="text-align:center;font-size:12px;color:var(--muted);margin:14px 0 0">
                Don't have an account yet? <a href="javascript:void(0)" onclick="FertiFind.switchAuthTab('register')" style="color:var(--blue);font-weight:800">Create one now</a>
              </p>
            </form>
          </div>

          <!-- View 2: Register -->
          <div class="auth-view" id="ffAuthViewRegister">
            <form class="ff-form" id="ffRegisterForm" onsubmit="FertiFind.submitRegister(event)">
              <div>
                <label>I am registering as:</label>
                <div class="role-picker">
                  <div class="role-chip active" id="chip-patient" onclick="FertiFind.selectRole('patient')">
                    <span class="role-ico">👤</span>
                    <span>Patient</span>
                  </div>
                  <div class="role-chip" id="chip-doctor" onclick="FertiFind.selectRole('doctor')">
                    <span class="role-ico">🩺</span>
                    <span>Doctor</span>
                  </div>
                  <div class="role-chip" id="chip-clinic" onclick="FertiFind.selectRole('clinic')">
                    <span class="role-ico">🏥</span>
                    <span>Clinic</span>
                  </div>
                  <div class="role-chip" id="chip-hospital" onclick="FertiFind.selectRole('hospital')">
                    <span class="role-ico">🏨</span>
                    <span>Hospital/Lab</span>
                  </div>
                </div>
                <input type="hidden" id="ffRegRole" value="patient">
              </div>

              <!-- Provider notice callout -->
              <div class="auth-b2b-callout" id="ffProviderNotice" style="display:none">
                <div>
                  <b style="display:block;font-size:12px">Registering a Medical Practice?</b>
                  <span>Submit your DHA license, address & WhatsApp for direct leads.</span>
                </div>
                <a class="btn btn-primary btn-xs" href="submit-business.html" onclick="FertiFind.closeModal('ffAuthModal')">Submit Details →</a>
              </div>

              <div>
                <label id="ffRegNameLabel">Full Name</label>
                <input type="text" id="ffRegName" required placeholder="e.g. Dr. Sarah Mansoori">
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                <div>
                  <label>Email Address</label>
                  <input type="email" id="ffRegEmail" required placeholder="name@domain.ae">
                </div>
                <div>
                  <label>Mobile (+971 UAE)</label>
                  <input type="tel" id="ffRegMobile" required placeholder="+971 50 XXX XXXX">
                </div>
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                <div>
                  <label>Password</label>
                  <div class="input-pass-wrap">
                    <input type="password" id="ffRegPass" required placeholder="••••••••">
                    <button type="button" class="pass-toggle-btn" onclick="FertiFind.togglePassVisibility('ffRegPass', this)">👁</button>
                  </div>
                </div>
                <div>
                  <label>Confirm Password</label>
                  <div class="input-pass-wrap">
                    <input type="password" id="ffRegPassConf" required placeholder="••••••••">
                    <button type="button" class="pass-toggle-btn" onclick="FertiFind.togglePassVisibility('ffRegPassConf', this)">👁</button>
                  </div>
                </div>
              </div>

              <label style="display:flex;gap:8px;align-items:flex-start;font-size:11px;color:var(--muted);cursor:pointer;margin-top:2px">
                <input type="checkbox" required checked style="width:15px;height:15px;margin-top:1px">
                <span>I agree to FertiFind's <a href="javascript:void(0)" onclick="FertiFind.openInfo('privacy')" style="color:var(--blue);font-weight:700">Terms of Service</a> & UAE Healthcare Guidelines.</span>
              </label>

              <button type="submit" class="btn btn-primary" id="ffRegSubmitBtn" style="width:100%;padding:12px">Create Account →</button>

              <p style="text-align:center;font-size:12px;color:var(--muted);margin:14px 0 0">
                Already registered? <a href="javascript:void(0)" onclick="FertiFind.switchAuthTab('login')" style="color:var(--blue);font-weight:800">Log In here</a>
              </p>
            </form>
          </div>

          <!-- View 3: Forgot Password -->
          <div class="auth-view" id="ffAuthViewForgot">
            <form class="ff-form" id="ffForgotForm" onsubmit="FertiFind.submitForgot(event)">
              <div style="background:#f8fbff;border:1px solid var(--line);border-radius:var(--radius-sm);padding:12px;font-size:12px;color:#455a7a;line-height:1.5">
                🔑 Enter your registered email address or mobile phone number. We will send a secure password reset link and 6-digit verification code.
              </div>
              <div>
                <label>Registered Email or Phone</label>
                <input type="text" id="ffForgotContact" required placeholder="name@clinic.ae or +971 50 XXX XXXX">
              </div>
              <button type="submit" class="btn btn-primary" style="width:100%;padding:12px">Send Password Reset Code →</button>

              <p style="text-align:center;font-size:12px;color:var(--muted);margin:14px 0 0">
                Remember your password? <a href="javascript:void(0)" onclick="FertiFind.switchAuthTab('login')" style="color:var(--blue);font-weight:800">← Back to Log In</a>
              </p>
            </form>
          </div>

        </div>
      </div>

      <!-- Toast Notification -->
      <div class="ff-toast" id="ffToast">
        <span style="font-size:16px">✓</span>
        <span id="ffToastMsg">Action completed successfully</span>
      </div>
    `;

    document.body.appendChild(modalContainer);

    const dateInput = document.getElementById('ffBookingDate');
    if (dateInput) {
      dateInput.min = new Date().toISOString().split('T')[0];
    }

    document.querySelectorAll('.ff-modal').forEach(m => {
      m.addEventListener('click', e => {
        if (e.target === m) FertiFind.closeModal(m.id);
      });
    });

    const bookingForm = document.getElementById('ffBookingForm');
    if (bookingForm) {
      bookingForm.onsubmit = function (e) {
        e.preventDefault();
        const ref = 'FF-DXB-' + Math.floor(100000 + Math.random() * 900000);
        const name = (document.getElementById('ffBookingName') ? document.getElementById('ffBookingName').value : '') || 'Patient';
        const provider = (document.getElementById('ffBookingProvider') ? document.getElementById('ffBookingProvider').value : '') || 'Specialist';
        const service = (document.getElementById('ffBookingService') ? document.getElementById('ffBookingService').value : '') || 'Consultation';
        const phone = (document.getElementById('ffBookingPhone') ? document.getElementById('ffBookingPhone').value : '');
        const date = (document.getElementById('ffBookingDate') ? document.getElementById('ffBookingDate').value : '2025-09-24');

        if (window.FertiFirebase) {
          FertiFirebase.addAppointment({
            id: ref,
            patientName: name,
            doctorName: provider,
            specialty: service,
            dateTime: date + ' 10:00 AM',
            phone: phone,
            status: 'Pending'
          });
        }

        FertiFind.closeModal('ffBookingModal');
        FertiFind.toast(`Appointment request submitted! Reference #${ref}. The clinic coordinator will contact you.`);
        bookingForm.reset();
      };
    }

    const reviewForm = document.getElementById('ffReviewForm');
    if (reviewForm) {
      reviewForm.onsubmit = function (e) {
        e.preventDefault();
        const reviewer = (document.getElementById('ffReviewName') ? document.getElementById('ffReviewName').value : '') || 'Patient';
        const provider = (document.getElementById('ffReviewProvider') ? document.getElementById('ffReviewProvider').value : '') || 'Doctor';
        const comment = (document.getElementById('ffReviewComment') ? document.getElementById('ffReviewComment').value : '') || 'Great consultation and care.';
        const rating = Number(document.getElementById('ffRatingValue') ? document.getElementById('ffRatingValue').value : 5) || 5;

        if (window.FertiFirebase) {
          FertiFirebase.addReview({
            patientName: reviewer,
            doctorName: provider,
            rating: rating,
            comment: comment,
            date: 'Just now',
            verified: true
          });
        }

        FertiFind.closeModal('ffReviewModal');
        FertiFind.toast('Thank you! Your verified patient review has been received.');
        reviewForm.reset();
      };
    }

    const listForm = document.getElementById('ffListForm');
    if (listForm) {
      listForm.onsubmit = function (e) {
        e.preventDefault();
        FertiFind.closeModal('ffListBusinessModal');
        FertiFind.toast('Practice submission received. Our DHA registry team will verify your credentials.');
        listForm.reset();
      };
    }

    const starSelector = document.getElementById('ffStarSelector');
    if (starSelector) {
      const stars = starSelector.querySelectorAll('span');
      stars.forEach((s, idx) => {
        s.addEventListener('click', () => {
          const val = idx + 1;
          document.getElementById('ffRatingValue').value = val;
          stars.forEach((st, i) => {
            st.style.color = i < val ? '#f2ad2e' : '#cfd9e8';
          });
        });
      });
    }
  }

  window.FertiFind = {
    openBooking: function (providerName, defaultService) {
      initGlobalModals();
      document.getElementById('ffBookingProvider').value = providerName || 'FertiFind Medical Partner';
      if (defaultService) {
        document.getElementById('ffBookingService').value = defaultService;
      }
      document.getElementById('ffBookingModal').classList.add('show');
    },

    openReview: function (providerName) {
      initGlobalModals();
      document.getElementById('ffReviewProvider').value = providerName || 'Healthcare Provider';
      document.getElementById('ffReviewModal').classList.add('show');
    },

    openListBusiness: function (prefillName) {
      initGlobalModals();
      const modal = document.getElementById('ffListBusinessModal');
      if (modal) {
        if (prefillName) {
          const input = modal.querySelector('input[type="text"]');
          if (input) input.value = prefillName;
        }
        modal.classList.add('show');
      }
    },

    openClaimProfile: function (providerName) {
      this.openListBusiness(providerName);
      const title = document.querySelector('#ffListBusinessModal h3');
      if (title && providerName) {
        title.textContent = `Claim Profile: ${providerName}`;
      }
    },

    openWhatsApp: function (phone, providerName) {
      const cleanPhone = (phone || '971504773832').replace(/[^0-9]/g, '');
      const msg = encodeURIComponent(`Hello, I found ${providerName || 'your practice'} on FertiFind Dubai and would like to inquire about booking a specialist consultation.`);
      window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
    },

    closeModal: function (modalId) {
      const el = document.getElementById(modalId);
      if (el) el.classList.remove('show');
    },

    openInfo: function (type) {
      initGlobalModals();
      const titleEl = document.getElementById('ffInfoTitle');
      const subEl = document.getElementById('ffInfoSubtitle');
      const contentEl = document.getElementById('ffInfoContent');

      const infoPages = {
        about: {
          title: "About FertiFind Dubai",
          sub: "Independent fertility and reproductive healthcare directory",
          body: `
            <p><strong>FertiFind Dubai</strong> is an independent digital directory connecting patients with DHA-licensed fertility doctors, IVF centres, women's hospitals, and diagnostic genetics laboratories across Dubai.</p>
            <p>Our platform organizes clinical credentials, facility accreditations, treatment specialties, and verified patient reviews so couples can navigate reproductive care with confidence.</p>
          `
        },
        contact: {
          title: "Contact FertiFind Desk",
          sub: "Patient support & provider coordination",
          body: `
            <div style="background:#f7faff;border:1px solid #e5eaf2;padding:14px;border-radius:10px">
              <p style="margin:4px 0">📍 <strong>Address:</strong> Building 27, Dubai Healthcare City, Dubai, UAE</p>
              <p style="margin:4px 0">☎ <strong>Support Desk:</strong> +971 4 437 7520</p>
              <p style="margin:4px 0">✉ <strong>Email:</strong> care@fertifind.ae</p>
              <p style="margin:4px 0">🕒 <strong>Hours:</strong> Saturday – Thursday, 08:30 AM – 06:00 PM</p>
            </div>
          `
        },
        privacy: {
          title: "Privacy & Health Data Security",
          sub: "UAE Health Data Protection Standards",
          body: `
            <p>We take patient privacy and medical confidentiality seriously. FertiFind Dubai does not share, sell, or commercialize your personal medical inquiries.</p>
            <p>All appointment requests are routed directly to the designated healthcare provider in compliance with UAE Federal Law on Health Data Protection.</p>
          `
        },
        packages: {
          title: "Fertility Treatment Packages Guide",
          sub: "Estimated costs & inclusions in Dubai",
          body: `
            <p>Standard IVF/ICSI cycles in Dubai range from AED 25,000 to AED 45,000 depending on ovarian stimulation medication protocols, embryology requirements, and pre-implantation genetic testing (PGT-A).</p>
            <p>We advise checking exact inclusions (ultrasound monitoring, egg collection, embryology, and embryo freezing) directly with your selected clinic.</p>
          `
        },
        login: {
          title: "Provider Portal Sign In",
          sub: "Manage practice listing and patient leads",
          body: `
            <div style="background:#f7faff;border:1px solid #e5eaf2;padding:14px;border-radius:10px">
              <label style="font-weight:700;display:block;margin-bottom:4px;font-size:12px">Registered Provider Email / DHA ID</label>
              <input type="text" placeholder="provider@clinic.ae" style="width:100%;padding:10px;border:1px solid #cfd9e8;border-radius:8px;margin-bottom:8px">
              <label style="font-weight:700;display:block;margin-bottom:4px;font-size:12px">Password</label>
              <input type="password" placeholder="••••••••" style="width:100%;padding:10px;border:1px solid #cfd9e8;border-radius:8px">
              <button class="btn btn-primary" style="width:100%;margin-top:12px" onclick="FertiFind.closeModal('ffInfoModal');FertiFind.toast('Demo sign-in: Welcome to your provider dashboard.')">Log In to Portal</button>
            </div>
          `
        }
      };

      if (type === 'login') {
        this.openAuth('login');
        return;
      }

      const selected = infoPages[type] || infoPages.about;
      titleEl.textContent = selected.title;
      subEl.textContent = selected.sub;
      contentEl.innerHTML = selected.body;

      document.getElementById('ffInfoModal').classList.add('show');
    },

    openAuth: function (tab) {
      initGlobalModals();
      this.switchAuthTab(tab || 'login');
      const modal = document.getElementById('ffAuthModal');
      if (modal) modal.classList.add('show');
    },

    switchAuthTab: function (tab) {
      const tabs = ['login', 'register', 'forgot'];
      tabs.forEach(t => {
        const btn = document.getElementById('ffAuthTab' + t.charAt(0).toUpperCase() + t.slice(1));
        const view = document.getElementById('ffAuthView' + t.charAt(0).toUpperCase() + t.slice(1));
        if (btn) btn.classList.toggle('active', t === tab);
        if (view) view.classList.toggle('active', t === tab);
      });
      const title = document.getElementById('ffAuthMainTitle');
      const sub = document.getElementById('ffAuthMainSubtitle');
      if (title && sub) {
        if (tab === 'login') {
          title.textContent = 'Welcome Back';
          sub.textContent = 'Log in to your FertiFind patient or provider account';
        } else if (tab === 'register') {
          title.textContent = 'Create an Account';
          sub.textContent = 'Join Dubai\'s leading verified healthcare directory';
        } else if (tab === 'forgot') {
          title.textContent = 'Reset Password';
          sub.textContent = 'Recover access to your account via email or SMS';
        }
      }
    },

    selectRole: function (role) {
      ['patient', 'doctor', 'clinic', 'hospital'].forEach(r => {
        const chip = document.getElementById('chip-' + r);
        if (chip) chip.classList.toggle('active', r === role);
      });
      const input = document.getElementById('ffRegRole');
      if (input) input.value = role;

      const notice = document.getElementById('ffProviderNotice');
      const nameLabel = document.getElementById('ffRegNameLabel');
      const submitBtn = document.getElementById('ffRegSubmitBtn');

      if (role === 'doctor') {
        if (notice) notice.style.display = 'flex';
        if (nameLabel) nameLabel.textContent = 'Doctor Full Name & Title';
        if (submitBtn) submitBtn.textContent = 'Register Doctor & Continue →';
      } else if (role === 'clinic' || role === 'hospital') {
        if (notice) notice.style.display = 'flex';
        if (nameLabel) nameLabel.textContent = 'Practice / Facility Name';
        if (submitBtn) submitBtn.textContent = 'Register Practice & Continue →';
      } else {
        if (notice) notice.style.display = 'none';
        if (nameLabel) nameLabel.textContent = 'Full Name';
        if (submitBtn) submitBtn.textContent = 'Create Patient Account →';
      }
    },

    togglePassVisibility: function (inputId, btnEl) {
      const input = document.getElementById(inputId);
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        if (btnEl) btnEl.textContent = '🙈';
      } else {
        input.type = 'password';
        if (btnEl) btnEl.textContent = '👁';
      }
    },

    submitLogin: function (e) {
      if (e) e.preventDefault();
      const emailInput = document.getElementById('ffLoginEmail');
      const email = emailInput ? emailInput.value.trim() : '';
      const passInput = document.getElementById('ffLoginPass');
      const pass = passInput ? passInput.value : '';

      if (!email || !pass) {
        alert('Please enter your email and password.');
        return;
      }

      let role = email.includes('clinic') || email.includes('dr') || email.includes('doctor') ? 'doctor' : 'patient';
      let name = role === 'doctor' ? 'Dr. Partha Sarathi (DHCC)' : email.split('@')[0];

      const user = { name, email, role, loggedInAt: new Date().toISOString() };
      localStorage.setItem('ff_user', JSON.stringify(user));

      this.closeModal('ffAuthModal');
      this.updateAuthUI();
      this.toast(`Welcome back, ${name}! Signed in successfully.`);
    },

    submitRegister: function (e) {
      if (e) e.preventDefault();
      const name = document.getElementById('ffRegName').value.trim();
      const email = document.getElementById('ffRegEmail').value.trim();
      const mobile = document.getElementById('ffRegMobile').value.trim();
      const role = document.getElementById('ffRegRole').value;
      const pass = document.getElementById('ffRegPass').value;
      const passConf = document.getElementById('ffRegPassConf').value;

      if (pass !== passConf) {
        alert('Passwords do not match. Please verify your password confirmation.');
        return;
      }

      const user = { name, email, mobile, role, loggedInAt: new Date().toISOString() };
      localStorage.setItem('ff_user', JSON.stringify(user));

      this.closeModal('ffAuthModal');
      this.updateAuthUI();

      if (role === 'doctor' || role === 'clinic' || role === 'hospital') {
        this.toast(`Account created for ${name}! Please submit your practice details.`, 4000);
        setTimeout(() => {
          window.location.href = `submit-business.html?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}&mobile=${encodeURIComponent(mobile)}`;
        }, 1200);
      } else {
        this.toast(`Welcome to FertiFind, ${name}! Your patient account is ready.`);
      }
    },

    submitForgot: function (e) {
      if (e) e.preventDefault();
      const contact = document.getElementById('ffForgotContact').value.trim();
      if (!contact) return;
      this.closeModal('ffAuthModal');
      this.toast(`Password reset code & OTP sent to ${contact}. Check your inbox or phone.`);
    },

    demoLogin: function (role) {
      const user = {
        name: 'Dr. Partha Sarathi Das',
        email: 'dr.das@orchidfertility.ae',
        role: 'doctor',
        loggedInAt: new Date().toISOString()
      };
      localStorage.setItem('ff_user', JSON.stringify(user));
      this.closeModal('ffAuthModal');
      this.updateAuthUI();
      this.toast(`Logged in as ${user.name} (DOCTOR)`);
    },

    logout: function () {
      localStorage.removeItem('ff_user');
      this.updateAuthUI();
      this.toast('You have been signed out.');
    },

    checkAuth: function () {
      this.updateAuthUI();
    },

    updateAuthUI: function () {
      const userStr = localStorage.getItem('ff_user');
      const user = userStr ? JSON.parse(userStr) : null;

      // Update nav-actions across desktop
      document.querySelectorAll('.nav-actions').forEach(nav => {
        let authBtn = nav.querySelector('.btn-signin, .user-badge-nav');
        if (user) {
          const badgeHtml = `
            <div class="user-badge-nav">
              <span>${user.role === 'doctor' || user.role === 'clinic' || user.role === 'hospital' ? '🩺' : '👤'} ${user.name.split(' ')[0]}</span>
              <span class="logout-link" onclick="FertiFind.logout()" title="Sign out">✕</span>
            </div>
          `;
          if (authBtn) {
            authBtn.outerHTML = badgeHtml;
          } else {
            const wrap = document.createElement('div');
            wrap.innerHTML = badgeHtml;
            nav.insertBefore(wrap.firstElementChild, nav.firstChild);
          }
        } else {
          const signInHtml = `<button type="button" class="btn btn-outline btn-signin" onclick="FertiFind.openAuth('login')" style="padding:8px 12px;font-size:12px">Sign In</button>`;
          if (authBtn && authBtn.classList.contains('user-badge-nav')) {
            authBtn.outerHTML = signInHtml;
          } else if (!authBtn) {
            const wrap = document.createElement('div');
            wrap.innerHTML = signInHtml;
            nav.insertBefore(wrap.firstElementChild, nav.firstChild);
          }
        }
      });
    },

    toast: function (msg, duration) {
      initGlobalModals();
      const toastEl = document.getElementById('ffToast');
      const toastMsg = document.getElementById('ffToastMsg');
      if (toastEl && toastMsg) {
        toastMsg.textContent = msg;
        toastEl.classList.add('show');
        clearTimeout(toastEl._timer);
        toastEl._timer = setTimeout(() => {
          toastEl.classList.remove('show');
        }, duration || 3200);
      }
    },

    toggleShortlist: function (providerName, btn) {
      let saved = JSON.parse(localStorage.getItem('ff_shortlist') || '[]');
      const index = saved.indexOf(providerName);
      let isSaved = false;

      if (index === -1) {
        saved.push(providerName);
        isSaved = true;
      } else {
        saved.splice(index, 1);
        isSaved = false;
      }
      localStorage.setItem('ff_shortlist', JSON.stringify(saved));

      if (btn) {
        btn.textContent = isSaved ? '♥' : '♡';
        btn.style.color = isSaved ? '#d64b55' : 'inherit';
      }

      this.toast(isSaved ? `Added "${providerName}" to shortlist.` : `Removed "${providerName}" from shortlist.`);
    },

    toggleMobileMenu: function () {
      const drawer = document.getElementById('mobileDrawer');
      if (drawer) {
        drawer.classList.toggle('open');
      }
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    initGlobalModals();
    FertiFind.checkAuth();

    // Home search box routing to directory search page
    const heroSearchBtn = document.querySelector('#heroSearch button, #heroSearch .btn');
    if (heroSearchBtn) {
      heroSearchBtn.addEventListener('click', function (e) {
        e.preventDefault();
        const card = document.getElementById('heroSearch');
        const q = card.querySelector('input') ? card.querySelector('input').value : '';
        const area = card.querySelector('select') ? card.querySelector('select').value : 'all';
        window.location.href = `fertifind_dubai_directory_search_page.html?q=${encodeURIComponent(q)}&area=${encodeURIComponent(area)}`;
      });
    }

    const finderBtn = document.querySelector('.finder-grid button, #finderSearchBtn');
    if (finderBtn) {
      finderBtn.addEventListener('click', function (e) {
        e.preventDefault();
        const container = finderBtn.closest('.finder-box') || document.getElementById('finder');
        const qInput = container.querySelector('input');
        const selects = container.querySelectorAll('select');
        const q = qInput ? qInput.value : '';
        const type = selects[0] ? selects[0].value : 'all';
        const area = selects[1] ? selects[1].value : 'all';

        let typeParam = 'all';
        if (type.toLowerCase().includes('doctor')) typeParam = 'doctor';
        else if (type.toLowerCase().includes('clinic')) typeParam = 'clinic';
        else if (type.toLowerCase().includes('hospital')) typeParam = 'hospital';
        else if (type.toLowerCase().includes('diagnostic') || type.toLowerCase().includes('lab')) typeParam = 'lab';
        else if (type.toLowerCase().includes('home')) typeParam = 'home';

        window.location.href = `fertifind_dubai_directory_search_page.html?q=${encodeURIComponent(q)}&type=${encodeURIComponent(typeParam)}&area=${encodeURIComponent(area)}`;
      });
    }

    // Connect mobile toggle buttons
    const mobBtn = document.querySelector('.mobile-toggle, .menu-btn, .mobile, #mobileBtn, #mobile, .menu');
    if (mobBtn) {
      mobBtn.addEventListener('click', FertiFind.toggleMobileMenu);
    }

    // FAQ Accordion
    function initFaqs() {
      document.querySelectorAll('.faq-q').forEach(btn => {
        if (btn._faqBound) return;
        btn._faqBound = true;
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          const item = btn.closest('.faq-item') || btn.parentElement;
          if (!item) return;
          item.classList.toggle('open');
          const span = btn.querySelector('span');
          if (span) {
            span.textContent = item.classList.contains('open') ? '−' : '+';
          }
        });
      });
    }
    initFaqs();
  });

})();
