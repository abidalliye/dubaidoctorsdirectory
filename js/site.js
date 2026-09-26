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
        FertiFind.closeModal('ffBookingModal');
        const ref = 'FF-DXB-' + Math.floor(100000 + Math.random() * 900000);
        FertiFind.toast(`Appointment request submitted! Reference #${ref}. The clinic coordinator will contact you.`);
        bookingForm.reset();
      };
    }

    const reviewForm = document.getElementById('ffReviewForm');
    if (reviewForm) {
      reviewForm.onsubmit = function (e) {
        e.preventDefault();
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

    openListBusiness: function () {
      initGlobalModals();
      document.getElementById('ffListBusinessModal').classList.add('show');
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

      const selected = infoPages[type] || infoPages.about;
      titleEl.textContent = selected.title;
      subEl.textContent = selected.sub;
      contentEl.innerHTML = selected.body;

      document.getElementById('ffInfoModal').classList.add('show');
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
