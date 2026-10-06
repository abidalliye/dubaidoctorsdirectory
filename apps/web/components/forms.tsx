"use client";
import { useEffect, useRef, useState } from "react";
import { api, shortPrompt, User } from "../lib/client-api";
export type Field = {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: string[];
};
function DateInput({
  spec,
  value,
  onChange,
}: {
  spec: Field;
  value: string;
  onChange: (value: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      className="field"
      aria-label={spec.label}
      placeholder={shortPrompt(spec.label)}
      type={focused || value ? spec.type : "text"}
      value={value}
      required={spec.required}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
export function Fields({
  fields,
  values,
  onChange,
  facilities = [],
}: {
  fields: Field[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  facilities?: any[];
}) {
  const [error, setError] = useState("");
  return (
    <div className="form-grid three">
      {fields.map((f) => {
        const placeholder = shortPrompt(f.label),
          v = values[f.key] ?? "";
        return (
          <div
            key={f.key}
            className={`field-wrap ${["textarea", "affiliations"].includes(f.type || "") ? "full" : ""}`}
          >
            {f.type === "textarea" ? (
              <textarea
                className="field"
                aria-label={f.label}
                placeholder={placeholder}
                value={v}
                required={f.required}
                maxLength={12000}
                onChange={(e) => onChange(f.key, e.target.value)}
              />
            ) : f.type === "select" ? (
              <select
                className="field"
                aria-label={f.label}
                value={v}
                required={f.required}
                onChange={(e) => onChange(f.key, e.target.value)}
              >
                <option value="">{placeholder}</option>
                {f.options?.filter(Boolean).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : f.type === "affiliations" ? (
              <select
                className="field"
                aria-label={f.label}
                multiple
                value={Array.isArray(v) ? v : []}
                onChange={(e) =>
                  onChange(
                    f.key,
                    Array.from(e.target.selectedOptions).map((o) => o.value),
                  )
                }
              >
                {facilities.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            ) : f.type === "file" ? (
              <>
                <input
                  className="field"
                  aria-label={f.label}
                  type="file"
                  accept="application/pdf,image/png,image/jpeg"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 1048576) {
                      setError("Upload files up to 1 MB");
                      return;
                    }
                    try {
                      const content = await new Promise<string>(
                        (resolve, reject) => {
                          const r = new FileReader();
                          r.onload = () =>
                            resolve(String(r.result).split(",")[1]);
                          r.onerror = reject;
                          r.readAsDataURL(file);
                        },
                      );
                      const result = await api("dashboard/files", "POST", {
                        name: file.name,
                        type: file.type,
                        content,
                      });
                      onChange(f.key, result.id);
                      setError("");
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                />
                {v && (
                  <a className="link" href={`/v1/dashboard/files/${v}`}>
                    View Saved File
                  </a>
                )}
              </>
            ) : ["date", "time", "datetime-local"].includes(f.type || "") ? (
              <DateInput
                spec={f}
                value={v}
                onChange={(value) => onChange(f.key, value)}
              />
            ) : (
              <input
                className="field"
                aria-label={f.label}
                placeholder={placeholder}
                type={f.type || "text"}
                value={v}
                required={f.required}
                maxLength={f.type === "number" ? undefined : 500}
                min={f.type === "number" ? 0 : undefined}
                step={f.type === "number" ? "any" : undefined}
                onChange={(e) => onChange(f.key, e.target.value)}
              />
            )}
            {f.type === "affiliations" && (
              <small className="field-hint">
                Optional. Leave empty for an independent practice. Use
                Ctrl/Command to select multiple facilities.
              </small>
            )}
            {f.required && <span className="field-hint">Required</span>}
          </div>
        );
      })}
      {error && (
        <div className="error full" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prior = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const controls = ref.current?.querySelectorAll<HTMLElement>(
          'button,a[href],input,textarea,select,[tabindex="0"]',
        );
        if (!controls?.length) return;
        const first = controls[0],
          last = controls[controls.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      prior?.focus();
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="close" aria-label="Close dialog" onClick={onClose}>
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function ProfileWizard({
  user,
  schema,
  onClose,
  onSaved,
  savePath = "account/profile",
}: {
  user: User;
  schema: any;
  onClose: () => void;
  onSaved: (user: User) => void;
  savePath?: string;
}) {
  const steps =
    schema.profileSteps[user.role === "patient" ? "patient" : "business"];
  const [step, setStep] = useState(
      Math.min(Number(user.profile?.profileStep || 0), steps.length - 1),
    ),
    [values, setValues] = useState<Record<string, any>>({
      ...user.profile,
      name: user.name,
      phone: user.phone,
    }),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function save(next: boolean) {
    setBusy(true);
    setError("");
    try {
      const payload: Record<string, string> = {};
      for (const f of steps[step].fields)
        if (values[f.key] !== undefined) payload[f.key] = values[f.key];
      payload.profileStep = String(
        next ? Math.min(step + 1, steps.length - 1) : step,
      );
      payload.profileComplete =
        next && step === steps.length - 1 ? "yes" : "no";
      const r = await api(savePath, "PATCH", payload);
      onSaved(r.user);
      if (next && step < steps.length - 1) setStep(step + 1);
      else onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={
        user.role === "patient"
          ? "Complete Your Patient Profile"
          : "Complete Your Business Profile"
      }
      onClose={onClose}
    >
      <p className="muted" style={{ marginTop: 8 }}>
        Save your details step by step. You can return anytime.
      </p>
      <div className="stepper">
        {steps.map((s: any, i: number) => (
          <div
            className={`step-dot ${i <= step ? "active" : ""}`}
            key={s.title}
          >
            {i + 1}. {s.title}
          </div>
        ))}
      </div>
      <h3 style={{ marginBottom: 18 }}>{steps[step].title}</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(true);
        }}
      >
        <Fields
          fields={steps[step].fields}
          values={values}
          onChange={(k, v) => setValues({ ...values, [k]: v })}
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
              type="button"
              disabled={busy}
              className="button secondary"
              onClick={() => save(false)}
            >
              Save & Exit
            </button>
          </div>
          <button disabled={busy} className="button">
            {busy
              ? "Saving…"
              : step === steps.length - 1
                ? "Complete Profile"
                : "Save & Continue →"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
