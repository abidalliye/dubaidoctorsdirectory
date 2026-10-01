(async () => {
  "use strict";
  const root = document.getElementById("profile"),
    el = (tag, text, cls = "") => {
      const n = document.createElement(tag);
      n.textContent = text;
      n.className = cls;
      return n;
    };
  const slug = new URLSearchParams(location.search).get("slug");
  try {
    if (!slug) throw Error("Choose a provider from the directory");
    const response = await fetch("/v1/providers/" + encodeURIComponent(slug));
    let p;
    if (response.ok) p = await response.json();
    else {
      const user = await AuthGuard.refresh();
      if (!user)
        throw Error("This profile is unavailable or awaiting publication");
      p = (
        await AuthGuard.api(
          user.role === "admin" ? "admin/providers" : "account/providers",
        )
      ).items.find((x) => x.slug === slug);
      if (!p) throw Error("Profile unavailable");
    }
    document.title = p.name + " | Find Doctor Dubai";
    root.replaceChildren();
    const hero = el("section", "", "profile-hero");
    hero.append(
      el(
        "span",
        p.kind +
          " · " +
          (p.published === false
            ? "Private draft · awaiting review"
            : p.verified
              ? "Verified listing"
              : "Verification pending"),
      ),
      el("h1", p.name),
      el("p", p.specialty + " · " + p.area),
    );
    root.append(hero);
    const grid = el("section", "", "profile-details");
    root.append(grid);
    const details = {
      ...p.details,
      address: p.address,
      phone: p.phone,
      website: p.website,
      services: (p.services || []).join(", "),
    };
    const labels = {
      bio: "About",
      dhaLicense: "DHA license",
      professionalEmail: "Public contact email",
      languages: "Languages",
      qualifications: "Qualifications",
      experienceYears: "Experience (years)",
      insurance: "Accepted insurance",
      consultationFee: "Consultation fee (AED)",
      openingHours: "Opening hours",
      bookingNotice: "Booking notice",
      dailyLimit: "Daily consultation limit",
      smsNumber: "Contact number",
      departments: "Departments",
      facilities: "Facilities and equipment",
      socialLinks: "Social links",
      facility: "Affiliation description",
      address: "Address",
      phone: "Phone",
      website: "Website",
      services: "Services",
      leadDoctor: "Lead specialist",
      yearsInDubai: "Years established",
      accreditations: "Accreditations",
      unitNumber: "Unit / suite",
      streetAddress: "Street address",
      parking: "Parking",
      whatsapp: "WhatsApp",
    };
    for (const [key, label] of Object.entries(labels)) {
      if (!details[key]) continue;
      const c = el("article", "", "ff-card");
      c.append(el("h3", label), el("p", details[key]));
      grid.append(c);
    }
    if (p.affiliations?.length) {
      const c = el("article", "", "ff-card");
      c.append(el("h3", "Hospital and clinic affiliations"));
      for (const f of p.affiliations) {
        const a = el("a", f.name);
        a.href = "provider-profile.html?slug=" + encodeURIComponent(f.slug);
        c.append(a, el("br", ""));
      }
      grid.append(c);
    }
    // Business images are opt-in URLs and never private account documents.
    if (p.details?.photoUrl) {
      const u = new URL(p.details.photoUrl);
      if (["http:", "https:"].includes(u.protocol)) {
        const img = el("img", "");
        img.alt = p.name;
        img.src = u.href;
        img.referrerPolicy = "no-referrer";
        hero.prepend(img);
      }
    }
  } catch (e) {
    root.replaceChildren(el("p", e.message, "ff-form-error"));
  }
})();
