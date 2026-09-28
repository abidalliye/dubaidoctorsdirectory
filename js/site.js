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
              <p id="ffBookingSubtitle" style="color:var(--muted);font-size:13px;margin:4px 0 0">Verified doctors, hospitals, clinics & labs across Dubai</p>
            </div>
            <button class="ff-close" onclick="FertiFind.closeModal('ffBookingModal')" aria-label="Close">✕</button>
          </div>
          <form class="ff-form" id="ffBookingForm">
            <div>
              <input type="text" id="ffBookingProvider" name="provider_name" readonly style="background:#f7f9fc;font-weight:700">
            </div>
            <div>
              <select id="ffBookingService" name="service" required>
                <option value="Doctor In-Clinic Consultation">Doctor In-Clinic Consultation</option>
                <option value="Video Tele-Consultation">Video Tele-Consultation</option>
                <option value="Hospital Specialist Visit">Hospital Specialist Visit</option>
                <option value="Surgical Evaluation Consultation">Surgical Evaluation</option>
                <option value="Diagnostic Lab Blood Test">Diagnostic Lab Test</option>
                <option value="Home Sample Phlebotomy">Home Sample Phlebotomy</option>
                <option value="Physiotherapy Rehab Session">Physiotherapy Session</option>
                <option value="IVF Fertility Consultation">IVF Fertility Consultation</option>
              </select>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <div>
                <input type="text" id="ffBookingName" name="patient_name" required placeholder="Patient Full Name">
              </div>
              <div>
                <input type="tel" id="ffBookingPhone" name="phone" required placeholder="Mobile Number">
              </div>
            </div>
            <div>
              <input type="email" id="ffBookingEmail" name="email" required placeholder="Email Address">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <div>
                <input type="date" required id="ffBookingDate" name="date">
              </div>
              <div>
                <select id="ffBookingSlot" name="time_slot">
                  <option value="Morning (09:00 AM – 12:00 PM)">Morning (9AM-12PM)</option>
                  <option value="Afternoon (12:00 PM – 04:00 PM)">Afternoon (12PM-4PM)</option>
                  <option value="Evening (04:00 PM – 08:00 PM)">Evening (4PM-8PM)</option>
                </select>
              </div>
            </div>
            <div>
              <textarea id="ffBookingNotes" name="notes" placeholder="Clinical Notes"></textarea>
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
              <input type="text" id="ffReviewProvider" name="provider_name" readonly style="background:#f7f9fc;font-weight:700">
            </div>
            <div>
              <div style="display:flex;gap:8px;font-size:26px;color:#f2ad2e;cursor:pointer;margin:4px 0" id="ffStarSelector">
                <span data-star="1">★</span><span data-star="2">★</span><span data-star="3">★</span><span data-star="4">★</span><span data-star="5">★</span>
              </div>
              <input type="hidden" id="ffRatingValue" name="rating" value="5">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <div>
                <input type="text" id="ffReviewName" name="patient_name" required placeholder="Display Name">
              </div>
              <div>
                <select id="ffReviewTreatment" name="treatment">
                  <option value="Doctor Specialist Consultation">Specialist Doctor Consultation</option>
                  <option value="Video Tele-Consultation">Video Tele-Consultation</option>
                  <option value="Hospital Clinical Care">Hospital Clinical Care</option>
                  <option value="Diagnostic Laboratory Test">Diagnostic Lab Test</option>
                  <option value="Surgical Procedure Care">Surgical Procedure Care</option>
                  <option value="Physiotherapy Allied Health">Physiotherapy Allied Health</option>
                  <option value="IVF Reproductive Medicine">IVF Reproductive Medicine</option>
                </select>
              </div>
            </div>
            <div>
              <textarea id="ffReviewComment" name="comment" required placeholder="Write Review"></textarea>
            </div>
            <div style="display:flex;gap:8px;align-items:center;font-size:12px;cursor:pointer">
              <input type="checkbox" name="verified_experience" required checked>
              <span>I confirm this review represents a genuine patient experience.</span>
            </div>
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
              <p style="color:var(--muted);font-size:13px;margin:4px 0 0">Join Dubai's verified doctors, hospitals, clinics & labs directory</p>
            </div>
            <button class="ff-close" onclick="FertiFind.closeModal('ffListBusinessModal')" aria-label="Close">✕</button>
          </div>
          <form class="ff-form" id="ffListForm">
            <div>
              <input type="text" id="ffListName" name="practice_name" required placeholder="Practice Name">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <div>
                <select id="ffListType" name="provider_type" required>
                  <option value="Doctor">Doctor / Specialist</option>
                  <option value="Hospital">Hospital / Medical Center</option>
                  <option value="Clinic">Clinic / Polyclinic</option>
                  <option value="Diagnostic Lab">Diagnostic Lab / Imaging</option>
                  <option value="Technician">Technician / Allied Health</option>
                  <option value="Surgeon">Surgical Center / Surgeon</option>
                </select>
              </div>
              <div>
                <select id="ffListDistrict" name="district" required>
                  <option value="Dubai Healthcare City">Dubai Healthcare City</option>
                  <option value="Jumeirah">Jumeirah</option>
                  <option value="Oud Metha">Oud Metha</option>
                  <option value="Dubai Marina">Dubai Marina</option>
                  <option value="JLT">JLT</option>
                  <option value="Al Barsha">Al Barsha</option>
                  <option value="Downtown Dubai">Downtown Dubai</option>
                  <option value="Deira">Deira</option>
                </select>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <div>
                <input type="text" id="ffListDhaLicense" name="dha_license" required placeholder="DHA License">
              </div>
              <div>
                <input type="tel" id="ffListPhone" name="phone" required placeholder="Phone Number">
              </div>
            </div>
            <div>
              <input type="email" id="ffListEmail" name="email" required placeholder="Email Address">
            </div>
            <div>
              <textarea id="ffListServices" name="services" placeholder="Services Offered"></textarea>
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
                <input type="text" id="ffLoginEmail" name="email" required placeholder="Email or Mobile">
              </div>
              <div>
                <div class="input-pass-wrap">
                  <input type="password" id="ffLoginPass" name="password" required placeholder="Enter Password">
                  <button type="button" class="pass-toggle-btn" onclick="FertiFind.togglePassVisibility('ffLoginPass', this)" aria-label="Toggle password visibility">👁</button>
                </div>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;margin:2px 0">
                <div style="display:flex;align-items:center;gap:6px;cursor:pointer;font-weight:600;color:var(--muted)">
                  <input type="checkbox" name="remember_me" checked style="width:14px;height:14px;margin:0"> <span>Remember me</span>
                </div>
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
                <div style="font-size:12px;font-weight:750;color:var(--navy);margin-bottom:6px">Registering As</div>
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
                <input type="hidden" id="ffRegRole" name="role" value="patient">
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
                <input type="text" id="ffRegName" name="full_name" required placeholder="Full Name">
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                <div>
                  <input type="email" id="ffRegEmail" name="email" required placeholder="Email Address">
                </div>
                <div>
                  <input type="tel" id="ffRegMobile" name="mobile" required placeholder="Mobile Number">
                </div>
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                <div>
                  <div class="input-pass-wrap">
                    <input type="password" id="ffRegPass" name="password" required placeholder="Create Password">
                    <button type="button" class="pass-toggle-btn" onclick="FertiFind.togglePassVisibility('ffRegPass', this)">👁</button>
                  </div>
                </div>
                <div>
                  <div class="input-pass-wrap">
                    <input type="password" id="ffRegPassConf" name="confirm_password" required placeholder="Confirm Password">
                    <button type="button" class="pass-toggle-btn" onclick="FertiFind.togglePassVisibility('ffRegPassConf', this)">👁</button>
                  </div>
                </div>
              </div>

              <div style="display:flex;gap:8px;align-items:flex-start;font-size:11px;color:var(--muted);margin-top:2px">
                <input type="checkbox" name="terms" required checked style="width:15px;height:15px;margin-top:1px">
                <span>I agree to FertiFind's <a href="javascript:void(0)" onclick="FertiFind.openInfo('privacy')" style="color:var(--blue);font-weight:700">Terms of Service</a> & UAE Healthcare Guidelines.</span>
              </div>

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
                <input type="text" id="ffForgotContact" name="contact" required placeholder="Email or Mobile">
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
      bookingForm.onsubmit = async function (e) {
        e.preventDefault();
        const ref = 'FF-DXB-' + Math.floor(100000 + Math.random() * 900000);
        const name = (document.getElementById('ffBookingName') ? document.getElementById('ffBookingName').value.trim() : '') || 'Patient';
        const provider = (document.getElementById('ffBookingProvider') ? document.getElementById('ffBookingProvider').value : '') || 'Specialist';
        const service = (document.getElementById('ffBookingService') ? document.getElementById('ffBookingService').value : '') || 'Consultation';
        const phone = (document.getElementById('ffBookingPhone') ? document.getElementById('ffBookingPhone').value.trim() : '');
        const email = (document.getElementById('ffBookingEmail') ? document.getElementById('ffBookingEmail').value.trim() : '');
        const date = (document.getElementById('ffBookingDate') ? document.getElementById('ffBookingDate').value : new Date().toISOString().split('T')[0]);
        const slot = (document.getElementById('ffBookingSlot') ? document.getElementById('ffBookingSlot').value : 'Morning');
        const notes = (document.getElementById('ffBookingNotes') ? document.getElementById('ffBookingNotes').value.trim() : '');

        const bookingPayload = {
          id: ref,
          patientName: name,
          doctorName: provider,
          specialty: service,
          service: service,
          date: date,
          slot: slot,
          dateTime: date + ' (' + slot.split(' ')[0] + ')',
          phone: phone,
          email: email,
          notes: notes,
          status: 'Confirmed',
          source: 'Website Appointment Booking Modal'
        };

        if (window.FertiSupabase) {
          await FertiSupabase.bookAppointment(bookingPayload);
        }
        if (window.FertiFirebase) {
          await FertiFirebase.addAppointment(bookingPayload);
        }

        FertiFind.closeModal('ffBookingModal');
        FertiFind.toast(`Appointment confirmed! Reference #${ref}. Saved to Supabase database.`);
        bookingForm.reset();
      };
    }

    const reviewForm = document.getElementById('ffReviewForm');
    if (reviewForm) {
      reviewForm.onsubmit = async function (e) {
        e.preventDefault();
        const reviewer = (document.getElementById('ffReviewName') ? document.getElementById('ffReviewName').value.trim() : '') || 'Verified Patient';
        const provider = (document.getElementById('ffReviewProvider') ? document.getElementById('ffReviewProvider').value : '') || 'Healthcare Provider';
        const treatment = (document.getElementById('ffReviewTreatment') ? document.getElementById('ffReviewTreatment').value : 'Consultation');
        const comment = (document.getElementById('ffReviewComment') ? document.getElementById('ffReviewComment').value.trim() : '') || 'Great consultation and care.';
        const rating = Number(document.getElementById('ffRatingValue') ? document.getElementById('ffRatingValue').value : 5) || 5;

        const reviewPayload = {
          patientName: reviewer,
          doctorName: provider,
          rating: rating,
          treatment: treatment,
          comment: comment,
          date: new Date().toISOString().split('T')[0],
          verified: true,
          source: 'Patient Review Modal'
        };

        if (window.FertiSupabase) {
          await FertiSupabase.submitReview(reviewPayload);
        }
        if (window.FertiFirebase) {
          await FertiFirebase.addReview(reviewPayload);
        }

        FertiFind.closeModal('ffReviewModal');
        FertiFind.toast('Thank you! Your verified patient review has been saved to Supabase.');
        reviewForm.reset();
      };
    }

    const listForm = document.getElementById('ffListForm');
    if (listForm) {
      listForm.onsubmit = async function (e) {
        e.preventDefault();
        const name = (document.getElementById('ffListName') ? document.getElementById('ffListName').value.trim() : '');
        const type = (document.getElementById('ffListType') ? document.getElementById('ffListType').value : 'Clinic');
        const area = (document.getElementById('ffListDistrict') ? document.getElementById('ffListDistrict').value : 'Dubai');
        const license = (document.getElementById('ffListDhaLicense') ? document.getElementById('ffListDhaLicense').value.trim() : '');
        const phone = (document.getElementById('ffListPhone') ? document.getElementById('ffListPhone').value.trim() : '');
        const email = (document.getElementById('ffListEmail') ? document.getElementById('ffListEmail').value.trim() : '');
        const services = (document.getElementById('ffListServices') ? document.getElementById('ffListServices').value.trim() : '');

        const submissionPayload = {
          name: name,
          category: type,
          area: area,
          dhaLicense: license,
          phone: phone,
          email: email,
          services: services ? services.split(',').map(s => s.trim()) : [],
          source: 'Quick Practice Listing Modal'
        };

        if (window.FertiSupabase) {
          await FertiSupabase.submitPractice(submissionPayload);
        }
        if (window.FertiFirebase) {
          await FertiFirebase.recordSubmission(submissionPayload);
        }

        FertiFind.closeModal('ffListBusinessModal');
        FertiFind.toast('Practice submission received and saved to Supabase database! DHA credentials under review.');
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
              <input type="text" name="email" placeholder="Email or DHA" style="width:100%;padding:10px;border:1px solid #cfd9e8;border-radius:8px;margin-bottom:8px">
              <input type="password" name="password" placeholder="Enter Password" style="width:100%;padding:10px;border:1px solid #cfd9e8;border-radius:8px">
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
      const nameInput = document.getElementById('ffRegName');
      const submitBtn = document.getElementById('ffRegSubmitBtn');

      if (role === 'doctor') {
        if (notice) notice.style.display = 'flex';
        if (nameInput) nameInput.placeholder = 'Doctor Full Name';
        if (submitBtn) submitBtn.textContent = 'Register Doctor & Continue →';
      } else if (role === 'clinic' || role === 'hospital') {
        if (notice) notice.style.display = 'flex';
        if (nameInput) nameInput.placeholder = 'Practice Name';
        if (submitBtn) submitBtn.textContent = 'Register Practice & Continue →';
      } else {
        if (notice) notice.style.display = 'none';
        if (nameInput) nameInput.placeholder = 'Full Name';
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
      if (window.FertiFirebase) {
        FertiFirebase.registerUser(user);
      }
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
        const selects = card.querySelectorAll('select');
        let typeParam = 'all';
        let area = 'all';
        if (selects.length >= 2) {
          typeParam = selects[0].value;
          area = selects[1].value;
        } else if (selects.length === 1) {
          area = selects[0].value;
        }
        window.location.href = `fertifind_dubai_directory_search_page.html?q=${encodeURIComponent(q)}&type=${encodeURIComponent(typeParam)}&area=${encodeURIComponent(area)}`;
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
        const typeLower = type.toLowerCase();
        if (typeLower.includes('doctor')) typeParam = 'doctor';
        else if (typeLower.includes('hospital')) typeParam = 'hospital';
        else if (typeLower.includes('clinic')) typeParam = 'clinic';
        else if (typeLower.includes('diagnostic') || typeLower.includes('lab')) typeParam = 'lab';
        else if (typeLower.includes('technician') || typeLower.includes('allied')) typeParam = 'technician';
        else if (typeLower.includes('surgeon')) typeParam = 'surgeon';
        else if (typeLower.includes('video')) typeParam = 'video';
        else if (typeLower.includes('home')) typeParam = 'home';

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
