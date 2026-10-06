"use client";
import { useState } from "react";
import { api, User } from "../lib/client-api";
import { Fields, Modal } from "./forms";
export function ListingWizard({
  schema,
  user,
  provider,
  facilities,
  onClose,
  onSaved,
  inline = false,
}: {
  schema: any;
  user: User;
  provider?: any;
  facilities: any[];
  onClose: () => void;
  onSaved: () => void;
  inline?: boolean;
}) {
  const [step, setStep] = useState(
      Math.min(2, Number(provider?.details?.listingStep || 0)),
    ),
    [id, setId] = useState(provider?.id),
    [values, setValues] = useState<Record<string, any>>({
      ...provider?.details,
      ...provider,
      services: Array.isArray(provider?.services)
        ? provider.services.join(", ")
        : "",
      name: provider?.name || "",
      kind:
        provider?.kind ||
        (["admin", "patient"].includes(user.role) ? "doctor" : user.role),
      affiliationIds: provider?.affiliationIds || [],
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const groups = [
    {
      title: "Business Details",
      fields: schema.listingFields.filter((f: any) =>
        [
          "name",
          "kind",
          "phone",
          "specialty",
          "dhaLicense",
          "professionalEmail",
          "bio",
        ].includes(f.key),
      ),
    },
    {
      title: "Location & Contact",
      fields: schema.listingFields.filter((f: any) =>
        [
          "area",
          "address",
          "website",
          "photoUrl",
          "languages",
          "facility",
          "affiliationIds",
          "unitNumber",
          "streetAddress",
          "parking",
          "whatsapp",
        ].includes(f.key),
      ),
    },
    {
      title: "Services & Credentials",
      fields: schema.listingFields.filter(
        (f: any) =>
          f.key !== "listingStep" &&
          ![
            "name",
            "kind",
            "phone",
            "specialty",
            "dhaLicense",
            "professionalEmail",
            "bio",
            "area",
            "address",
            "website",
            "photoUrl",
            "languages",
            "facility",
            "affiliationIds",
            "unitNumber",
            "streetAddress",
            "parking",
            "whatsapp",
          ].includes(f.key),
      ),
    },
  ];
  async function save(exit = false) {
    setBusy(true);
    setError("");
    try {
      const body: Record<string, any> = {};
      body.listingStep = String(
        exit ? step : Math.min(step + 1, groups.length - 1),
      );
      for (const f of groups[step].fields)
        if (values[f.key] !== undefined) body[f.key] = values[f.key];
      if (!id) {
        body.name = values.name;
        body.kind = values.kind;
      }
      const r = await api(
        "account/providers" + (id ? "/" + id : ""),
        id ? "PATCH" : "POST",
        body,
      );
      setId(r.provider.id);
      onSaved();
      if (exit || step === groups.length - 1) onClose();
      else setStep(step + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const content = (
    <>
      <p className="muted" style={{ marginTop: 10 }}>
        Your listing is saved as a draft for review. Facility affiliation is
        optional.
      </p>
      <div className="stepper">
        {groups.map((s, i) => (
          <div
            key={s.title}
            className={`step-dot ${i <= step ? "active" : ""}`}
          >
            {i + 1}. {s.title}
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <h3 style={{ marginBottom: 20 }}>{groups[step].title}</h3>
        <Fields
          fields={groups[step].fields}
          values={values}
          onChange={(k, v) => setValues({ ...values, [k]: v })}
          facilities={facilities}
        />
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <div className="modal-actions">
          <div className="row">
            {step > 0 && (
              <button
                type="button"
                className="button secondary"
                onClick={() => setStep(step - 1)}
              >
                Back
              </button>
            )}
            <button
              disabled={busy}
              className="button secondary"
              type="button"
              onClick={() => save(true)}
            >
              Save & Exit
            </button>
          </div>
          <button className="button" disabled={busy}>
            {busy
              ? "Saving…"
              : step === groups.length - 1
                ? "Save for Review"
                : "Save & Continue →"}
          </button>
        </div>
      </form>
    </>
  );
  return inline ? (
    <div className="card">
      <h2>{provider?.id ? "Edit Listing" : "Create Your Business Listing"}</h2>
      {content}
    </div>
  ) : (
    <Modal
      title={provider?.id ? "Edit Business Listing" : "Add Business Listing"}
      onClose={onClose}
    >
      {content}
    </Modal>
  );
}
