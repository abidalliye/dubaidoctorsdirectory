// The UI consumes this exact schema; every editable field has a bounded database mapping.
export type FieldSpec = {
  key: string;
  label: string;
  type?: string;
  options?: string[];
  required?: boolean;
  max?: number;
};
const f = (
  key: string,
  label: string,
  type = "text",
  required = false,
  options?: string[],
): FieldSpec => ({ key, label, type, required, options });
export const roles = [
  "patient",
  "doctor",
  "clinic",
  "hospital",
  "lab",
  "surgeon",
  "technician",
  "admin",
];
export const providerKinds = roles.filter(
  (r) => !["patient", "admin"].includes(r),
);
export const profileSteps = {
  patient: [
    {
      title: "About you",
      fields: [
        f("name", "Full name", "text", true),
        f("phone", "Mobile phone", "tel"),
        f("dateOfBirth", "Date of birth", "date"),
        f("gender", "Gender", "select", false, [
          "",
          "Female",
          "Male",
          "Prefer not to say",
        ]),
        f("nationality", "Nationality"),
        f("languages", "Languages"),
      ],
    },
    {
      title: "Contact and care preferences",
      fields: [
        f("area", "Area"),
        f("address", "Address"),
        f("emergencyContact", "Emergency contact name"),
        f("emergencyPhone", "Emergency contact phone", "tel"),
        f("preferredContact", "Preferred contact", "select", false, [
          "",
          "Email",
          "Phone",
        ]),
        f("insurance", "Insurance provider"),
      ],
    },
    {
      title: "Private patient details",
      fields: [
        f("bloodGroup", "Blood group"),
        f("dhaPatientId", "DHA patient ID"),
        f("emiratesId", "Emirates ID (optional)"),
        f("allergies", "Allergies", "textarea"),
        f("medicalHistory", "Medical history you wish to share", "textarea"),
        f("bio", "About you", "textarea"),
      ],
    },
  ],
  business: [
    {
      title: "Your business",
      fields: [
        f("name", "Name", "text", true),
        f("phone", "Contact phone", "tel"),
        f("specialty", "Specialty / department"),
        f("dhaLicense", "DHA license"),
        f("professionalEmail", "Public contact email", "email"),
        f("bio", "Biography / business description", "textarea"),
      ],
    },
    {
      title: "Location and contact",
      fields: [
        f("area", "Area"),
        f("address", "Address"),
        f("website", "Website", "url"),
        f("photoUrl", "Photo / logo URL", "url"),
        f("languages", "Languages"),
        f("facility", "Affiliation description (optional)"),
      ],
    },
    {
      title: "Services and credentials",
      fields: [
        f("services", "Services (comma separated)", "textarea"),
        f("qualifications", "Qualifications", "textarea"),
        f("experienceYears", "Years of experience", "number"),
        f("insurance", "Accepted insurance"),
        f("consultationFee", "Consultation fee (AED)", "number"),
        f("openingHours", "Opening hours"),
        f("bookingNotice", "Minimum booking notice"),
        f("dailyLimit", "Daily consultation limit", "number"),
        f("smsNumber", "SMS contact number", "tel"),
        f("departments", "Departments (comma separated)"),
        f("facilities", "Facilities / equipment", "textarea"),
        f("socialLinks", "Social links", "textarea"),
      ],
    },
    {
      title: "Facility details (optional)",
      fields: [
        f("leadDoctor", "Lead specialist"),
        f("yearsInDubai", "Years established", "number"),
        f("accreditations", "Accreditations"),
        f("unitNumber", "Unit / suite"),
        f("streetAddress", "Street address"),
        f("parking", "Parking"),
        f("whatsapp", "WhatsApp", "tel"),
        f("plan", "Requested listing plan"),
        f("dhaCertified", "DHA certification declaration", "select", false, [
          "",
          "yes",
          "no",
        ]),
      ],
    },
  ],
};
export const listingFields: FieldSpec[] = [
  f("name", "Profile name", "text", true),
  f("kind", "Profile type", "select", true, providerKinds),
  f("listingStep", "Listing step", "select", false, ["0", "1", "2"]),
  ...profileSteps.business
    .flatMap((s) => s.fields)
    .filter((x) => x.key !== "name"),
  f(
    "affiliationIds",
    "Optional hospital / clinic affiliations",
    "affiliations",
  ),
];
const patient = f("patientName", "Patient name", "text", true),
  doctor = f("doctorName", "Doctor / provider name", "text", true),
  status = (options: string[]) =>
    f("status", "Status", "select", true, options);
export const modules: Record<
  string,
  { label: string; roles: string[]; fields: FieldSpec[] }
> = {
  appointments: {
    label: "Appointments",
    roles: roles,
    fields: [
      patient,
      doctor,
      f("specialty", "Specialty"),
      f("date", "Date", "date", true),
      f("timeSlot", "Time slot"),
      f("consultType", "Consultation type", "select", false, [
        "In clinic",
        "Video",
        "Home visit",
      ]),
      f("phone", "Contact phone", "tel"),
      f("email", "Contact email", "email"),
      f("service", "Requested service"),
      status(["Requested", "Confirmed", "Completed", "Cancelled"]),
      f("notes", "Notes", "textarea"),
    ],
  },
  reviews: {
    label: "Reviews",
    roles: roles,
    fields: [
      f("target", "Provider name", "text", true),
      f("rating", "Rating", "select", true, ["1", "2", "3", "4", "5"]),
      f("comment", "Review", "textarea", true),
      f("patientName", "Display name"),
      f("treatment", "Treatment"),
      f("verifiedExperience", "Experience declaration", "select", false, [
        "",
        "yes",
        "no",
      ]),
      status(["Pending", "Published", "Hidden"]),
    ],
  },
  payments: {
    label: "Invoices and payments",
    roles: ["admin", "clinic", "hospital", "doctor", "lab"],
    fields: [
      patient,
      f("reference", "Invoice reference", "text", true),
      f("amount", "Amount (AED)", "number", true),
      f("date", "Date", "date"),
      status(["Draft", "Issued", "Paid", "Cancelled"]),
      f("description", "Description", "textarea"),
      f("method", "Payment method", "select", false, [
        "",
        "Card",
        "Cash",
        "Bank transfer",
        "Apple Pay",
        "Other",
      ]),
    ],
  },
  articles: {
    label: "Blog Posts",
    roles: [
      "admin",
      "doctor",
      "clinic",
      "hospital",
      "lab",
      "surgeon",
      "technician",
    ],
    fields: [
      f("title", "Title", "text", true),
      f("author", "Author"),
      f("excerpt", "Short summary", "textarea"),
      f("body", "Article content", "textarea", true),
      f("imageUrl", "Image URL", "url"),
      f("imageId", "Cover image", "file"),
      f("imageAlt", "Image description"),
      f("category", "Category"),
      f("tags", "Tags (comma separated)"),
      f("featured", "Featured post", "select", false, ["yes", "no"]),
      status(["Draft", "Pending", "Published"]),
    ],
  },
  admissions: {
    label: "Admissions and procedures",
    roles: ["admin", "clinic", "hospital"],
    fields: [
      patient,
      f("otRoom", "Room / OT suite"),
      f("leadSurgeon", "Lead surgeon"),
      f("procedureDateTime", "Procedure date and time", "datetime-local"),
      f("department", "Department"),
      status(["Scheduled", "Admitted", "Discharged", "Cancelled"]),
      f("notes", "Notes", "textarea"),
    ],
  },
  notes: {
    label: "Case notes",
    roles: ["admin", "doctor", "surgeon", "technician", "clinic", "hospital"],
    fields: [
      patient,
      f("condition", "Clinical condition"),
      f("findings", "Clinical findings", "textarea", true),
      f("date", "Date", "date"),
    ],
  },
  prescriptions: {
    label: "Prescription records",
    roles: ["admin", "doctor", "surgeon", "clinic", "hospital"],
    fields: [
      patient,
      f("orderType", "Order type", "select", false, [
        "Medication",
        "Laboratory test",
      ]),
      f("item", "Medication / test", "text", true),
      f("instructions", "Dosage / instructions", "textarea", true),
      f("date", "Date", "date"),
    ],
  },
  lab_requests: {
    label: "Lab requests",
    roles: roles,
    fields: [
      patient,
      f("testPackage", "Test / package", "text", true),
      f("deliveryAddress", "Collection address"),
      f("collectionSlot", "Collection date and time", "datetime-local", true),
      f("phone", "Contact phone", "tel"),
      f("email", "Contact email", "email"),
      f("service", "Requested service"),
      status(["Requested", "Confirmed", "Collected", "Completed", "Cancelled"]),
    ],
  },
  documents: {
    label: "Private documents",
    roles: roles,
    fields: [
      f("title", "Document title", "text", true),
      f("category", "Category", "select", true, [
        "Lab report",
        "Prescription",
        "Insurance",
        "Other",
      ]),
      f("fileId", "PDF / image (up to 1 MB)", "file", true),
    ],
  },
  tariffs: {
    label: "Consultation fees",
    roles: ["admin", ...providerKinds],
    fields: [
      f("name", "Fee name", "text", true),
      f("inClinicFee", "In-clinic fee (AED)", "number"),
      f("videoFee", "Video consultation fee (AED)", "number"),
      f("followupFee", "Follow-up fee (AED)", "number"),
    ],
  },
  schedules: {
    label: "Availability",
    roles: ["admin", ...providerKinds],
    fields: [
      f("activeDays", "Active days", "text", true),
      f("hoursRange", "Hours", "text", true),
      f("slotDuration", "Slot duration (minutes)", "number", true),
    ],
  },
  saved_providers: {
    label: "Saved providers",
    roles: roles,
    fields: [
      f("providerName", "Provider name", "text", true),
      f("website", "Website", "url"),
      f("notes", "Notes", "textarea"),
    ],
  },
  patients: {
    label: "Patient contact records",
    roles: ["admin", "doctor", "surgeon", "clinic", "hospital", "lab"],
    fields: [
      patient,
      f("email", "Email", "email"),
      f("phone", "Phone", "tel"),
      f("emiratesId", "Emirates ID (optional)"),
      f("condition", "Clinical condition"),
      f("notes", "Notes", "textarea"),
    ],
  },
};
for (const [key, label, fields] of [
  [
    "categories",
    "Blog categories",
    [
      f("name", "Category name", "text", true),
      f("description", "Description", "textarea"),
    ],
  ],
  ["tags", "Blog tags", [f("name", "Tag name", "text", true)]],
  [
    "pages",
    "CMS pages",
    [
      f("title", "Page title", "text", true),
      f("slug", "Page slug", "text", true),
      f("body", "Page content", "textarea", true),
      status(["Draft", "Published"]),
    ],
  ],
  [
    "banners",
    "CMS banners",
    [
      f("title", "Banner title", "text", true),
      f("imageUrl", "Image URL", "url", true),
      f("link", "Destination URL", "url"),
      status(["Draft", "Published"]),
    ],
  ],
  [
    "faqs",
    "CMS FAQ",
    [
      f("question", "Question", "text", true),
      f("answer", "Answer", "textarea", true),
      status(["Draft", "Published"]),
    ],
  ],
  [
    "subscriptions",
    "Plans and subscriptions",
    [
      f("customer", "Customer / provider", "text", true),
      f("plan", "Plan", "text", true),
      f("amount", "Amount (AED)", "number", true),
      f("renewalDate", "Renewal date", "date"),
      status(["Active", "Expired", "Cancelled"]),
    ],
  ],
  [
    "refunds",
    "Refund records",
    [
      f("reference", "Payment reference", "text", true),
      f("amount", "Amount (AED)", "number", true),
      f("reason", "Reason", "textarea"),
      status(["Requested", "Approved", "Processed", "Rejected"]),
    ],
  ],
  [
    "notifications",
    "Notifications",
    [
      f("title", "Title", "text", true),
      f("message", "Message", "textarea", true),
      f("recipient", "Recipient"),
      status(["Unread", "Read"]),
    ],
  ],
] as [string, string, FieldSpec[]][])
  modules[key] = { label, roles: ["admin"], fields };
export const settingFields = [
  f("siteName", "Site name"),
  f("supportEmail", "Support email", "email"),
  f("supportPhone", "Support phone", "tel"),
  f("address", "Business address"),
  f("defaultCurrency", "Currency"),
  f("bookingPolicy", "Booking policy", "textarea"),
];
