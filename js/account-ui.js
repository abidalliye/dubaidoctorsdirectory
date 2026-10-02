/* Database-backed dashboards. All forms use the server schema and authenticated APIs. */
(function () {
  "use strict";
  const el = (tag, text = "", cls = "") => {
    const n = document.createElement(tag);
    n.textContent = text;
    n.className = cls;
    return n;
  };
  let user,
    schema,
    facilities = [],
    active = "overview",
    query = "",
    requestId = 0;
  const api = (...args) => AuthGuard.api(...args);
  function message(text, error = false) {
    const n = document.getElementById("ff-message");
    n.textContent = text;
    n.className = "ff-message" + (error ? " error" : "");
    n.hidden = false;
  }
  function action(label, fn, cls = "btn btn-outline") {
    const b = el("button", label, cls);
    b.type = "button";
    b.onclick = async () => {
      b.disabled = true;
      try {
        await fn();
      } catch (e) {
        message(e.message, true);
      } finally {
        b.disabled = false;
      }
    };
    return b;
  }
  function heading(target, title, subtitle = "") {
    target.append(el("h2", title));
    if (subtitle) target.append(el("p", subtitle, "ff-muted"));
  }
  function dataForm(fields, values = {}) {
    const form = el("form", "", "ff-form");
    for (const spec of fields) {
      const label = el("label", spec.label, "ff-field");
      let input;
      if (spec.type === "affiliations") {
        input = el("select");
        input.multiple = true;
        for (const f of facilities) {
          const option = el("option", f.name + " · " + f.kind);
          option.value = f.id;
          option.selected = (values[spec.key] || []).includes(f.id);
          input.append(option);
        }
        label.append(
          el(
            "small",
            "Optional. Leave blank to operate independently. Hold Ctrl to select multiple facilities.",
          ),
        );
      } else if (spec.type === "select") {
        input = el("select");
        for (const value of spec.options) {
          const option = el("option", value || "Choose…");
          option.value = value;
          input.append(option);
        }
        input.value = values[spec.key] ?? spec.options[0];
      } else if (spec.type === "textarea") {
        input = el("textarea");
        input.rows = 4;
        input.value = values[spec.key] || "";
      } else {
        input = el("input");
        input.type = spec.type === "file" ? "file" : spec.type || "text";
        if (input.type === "file") input.accept = ".pdf,.png,.jpg,.jpeg";
        else input.value = values[spec.key] ?? "";
        if (input.type === "number") {
          input.min = "0";
          input.step = "any";
        }
      }
      input.name = spec.key;
      input.required =
        !!spec.required && !(spec.type === "file" && values[spec.key]);
      input.maxLength = spec.max || (spec.type === "textarea" ? 12000 : 500);
      input.className = "input-field";
      label.append(input);
      form.append(label);
      if (spec.type === "file" && values[spec.key]) {
        const link = el("a", "Download saved document");
        link.href =
          "/v1/dashboard/files/" + encodeURIComponent(values[spec.key]);
        label.append(link);
        input.dataset.saved = values[spec.key];
      }
    }
    return form;
  }
  async function payload(form, fields) {
    const result = {};
    for (const f of fields) {
      const input = form.elements.namedItem(f.key);
      if (!input) continue;
      if (f.type === "affiliations")
        result[f.key] = [...input.selectedOptions].map((o) => o.value);
      else if (f.type === "file") {
        if (input.files[0]) {
          const file = input.files[0];
          if (file.size > 1048576)
            throw Error("Please choose a document up to 1 MB");
          const content = await new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result.split(",")[1]);
            r.onerror = reject;
            r.readAsDataURL(file);
          });
          result[f.key] = (
            await api("dashboard/files", "POST", {
              name: file.name,
              type: file.type,
              content,
            })
          ).id;
        } else result[f.key] = input.dataset.saved || "";
      } else result[f.key] = input.value;
    }
    return result;
  }
  function modal(title) {
    const dialog = el("dialog", "", "ff-dialog");
    const header = el("header", "", "ff-dialog-head");
    header.append(
      el("h2", title),
      action("Close", () => dialog.close()),
    );
    dialog.append(header);
    document.body.append(dialog);
    dialog.addEventListener("close", () => dialog.remove());
    dialog.showModal();
    return dialog;
  }
  function bindSave(form, fields, save, after, label = "Save to database") {
    const footer = el("div", "", "ff-form-actions"),
      submit = el("button", label, "btn btn-primary");
    submit.type = "submit";
    footer.append(submit);
    form.append(footer);
    form.onsubmit = async (e) => {
      e.preventDefault();
      submit.disabled = true;
      try {
        await save(await payload(form, fields));
        message("Saved to database");
        if (after) await after();
      } catch (err) {
        message(err.message, true);
        const error =
          form.querySelector(".ff-form-error") || el("p", "", "ff-form-error");
        error.textContent = err.message;
        form.append(error);
      } finally {
        submit.disabled = false;
      }
    };
  }
  async function profileWizard(target = user, adminEdit = false) {
    const initialName = target.name;
    let step = 0,
      values = { ...target.profile, name: target.name, phone: target.phone };
    const steps =
      target.role === "patient"
        ? schema.profileSteps.patient
        : schema.profileSteps.business;
    if (target.profile?.profileComplete !== "yes")
      step = Math.min(
        Number(target.profile?.profileStep) || 0,
        steps.length - 1,
      );
    const dialog = modal(
      adminEdit
        ? "Edit " + target.name
        : "Complete your " +
            (target.role === "patient" ? "patient" : "business") +
            " profile",
    );
    const progress = el("div", "", "ff-progress"),
      body = el("div");
    dialog.append(progress, body);
    const draw = () => {
      progress.replaceChildren();
      steps.forEach((s, i) => {
        const n = el(
          "span",
          i + 1 + ". " + s.title,
          i === step ? "current" : i < step ? "done" : "",
        );
        progress.append(n);
      });
      body.replaceChildren();
      heading(
        body,
        steps[step].title,
        target.role === "patient"
          ? "These details are private to your account and administrators."
          : "Build a complete directory profile. Affiliation is optional.",
      );
      const form = dataForm(steps[step].fields, values);
      body.append(form);
      const footer = el("div", "", "ff-form-actions");
      if (step > 0)
        footer.append(
          action("Back", () => {
            for (const f of steps[step].fields)
              values[f.key] = form.elements[f.key].value;
            step--;
            draw();
          }),
        );
      const next = el(
        "button",
        step === steps.length - 1 ? "Complete profile" : "Save & continue",
        "btn btn-primary",
      );
      next.type = "submit";
      footer.append(next);
      form.append(footer);
      form.onsubmit = async (e) => {
        e.preventDefault();
        next.disabled = true;
        try {
          const data = await payload(form, steps[step].fields);
          Object.assign(values, data);
          const endpoint = adminEdit
            ? "admin/profiles/" + target.id
            : "account/profile";
          const saved = await api(endpoint, "PATCH", {
            ...data,
            profileStep: String(Math.min(step + 1, steps.length - 1)),
            ...(step === steps.length - 1 ? { profileComplete: "yes" } : {}),
          });
          target = saved.user;
          if (!adminEdit) user = saved.user;
          if (step < steps.length - 1) {
            step++;
            draw();
          } else {
            if (!adminEdit) {
              user = await AuthGuard.refresh();
              if (schema.providerKinds.includes(user.role)) {
                const owned = (await api("account/providers")).items;
                const primary = owned.find(
                  (p) => p.kind === user.role && p.name === initialName,
                );
                const business = { kind: user.role };
                for (const f of schema.listingFields)
                  if (values[f.key] !== undefined)
                    business[f.key] = values[f.key];
                if (primary)
                  await api(
                    "account/providers/" + primary.id,
                    "PATCH",
                    business,
                  );
                else await api("account/providers", "POST", business);
              }
            }
            dialog.close();
            message(
              "Profile saved" +
                (schema.providerKinds.includes(target.role) && !adminEdit
                  ? ". Directory draft submitted for review."
                  : "."),
            );
            await render();
          }
        } catch (err) {
          const n =
            form.querySelector(".ff-form-error") ||
            el("p", "", "ff-form-error");
          n.textContent = err.message;
          form.append(n);
        } finally {
          next.disabled = false;
        }
      };
    };
    draw();
  }
  async function listingEditor(provider) {
    const dialog = modal(
      provider
        ? "Edit directory profile"
        : "Add an independent directory profile",
    );
    heading(
      dialog,
      "Business details",
      "Doctors, labs and facilities may be independent. Optional affiliations never replace ownership. Changes go to administrator review.",
    );
    const values = provider
      ? {
          ...provider.details,
          ...provider,
          services: (provider.services || []).join(", "),
        }
      : {
          kind: schema.providerKinds.includes(user.role) ? user.role : "doctor",
        };
    const form = dataForm(schema.listingFields, values);
    dialog.append(form);
    bindSave(
      form,
      schema.listingFields,
      (data) =>
        api(
          "account/providers" + (provider ? "/" + provider.id : ""),
          provider ? "PATCH" : "POST",
          data,
        ),
      async () => {
        dialog.close();
        await render();
      },
    );
  }
  async function recordEditor(key, record) {
    const m = schema.modules[key],
      dialog = modal((record ? "Edit " : "Add ") + m.label);
    const form = dataForm(m.fields, record?.data || {});
    dialog.append(form);
    bindSave(
      form,
      m.fields,
      (data) =>
        api(
          "dashboard/records/" + key + (record ? "/" + record.id : ""),
          record ? "PATCH" : "POST",
          data,
        ),
      async () => {
        dialog.close();
        await render();
      },
    );
  }
  function card(title, description) {
    const n = el("article", "", "ff-card");
    n.append(el("h3", title), el("p", description, "ff-muted"));
    return n;
  }
  async function records(target, key) {
    const m = schema.modules[key];
    heading(
      target,
      m.label,
      "Records are stored in PostgreSQL. You see your own records; administrators can manage all records.",
    );
    if (key === "payments")
      target.append(
        el(
          "p",
          "This records invoices and payment status. It does not charge a card.",
          "ff-muted",
        ),
      );
    if (key === "prescriptions")
      target.append(
        el(
          "p",
          "Recordkeeping only; saving a record does not send or dispense medication.",
          "ff-muted",
        ),
      );
    if (m.roles.includes(user.role))
      target.append(
        action("Add record", () => recordEditor(key), "btn btn-primary"),
      );
    let page = 1;
    const list = el("div", "", "ff-grid");
    target.append(list);
    const load = async () => {
      const data = await api("dashboard/records/" + key + "?page=" + page);
      list.replaceChildren();
      for (const r of data.items) {
        const text = Object.values(r.data).join(" ").toLowerCase();
        if (query && !text.includes(query)) continue;
        const c = card(
          r.data.title ||
            r.data.patientName ||
            r.data.name ||
            r.data.target ||
            r.data.providerName ||
            m.label,
          "Updated " + new Date(r.updated_at).toLocaleString(),
        );
        for (const f of m.fields) {
          if (f.type === "file") {
            if (r.data[f.key]) {
              const link = el("a", "Download " + f.label);
              link.href = "/v1/dashboard/files/" + r.data[f.key];
              c.append(link);
            }
          } else c.append(el("p", f.label + ": " + (r.data[f.key] || "—")));
        }
        if (m.roles.includes(user.role))
          c.append(
            action("Edit", () => recordEditor(key, r)),
            action("Archive", async () => {
              await api(
                "dashboard/records/" + key + "/" + r.id + "/archive",
                "POST",
                {},
              );
              await load();
            }),
          );
        list.append(c);
      }
      if (!list.children.length)
        list.append(el("p", "No records on this page."));
    };
    target.append(
      action("Previous", async () => {
        page = Math.max(1, page - 1);
        await load();
      }),
      action("Next", async () => {
        page++;
        await load();
      }),
    );
    await load();
  }
  let includeArchived = false;
  async function listings(target) {
    heading(
      target,
      "Directory profiles",
      "Create doctors, clinics, hospitals, labs, surgeons or technicians independently, or link them to an existing facility.",
    );
    target.append(
      action("Add profile", () => listingEditor(), "btn btn-primary"),
    );
    target.append(
      action(includeArchived ? "Hide archived" : "Show archived", async () => {
        includeArchived = !includeArchived;
        await render();
      }),
    );
    const data = await api(
      (user.role === "admin" ? "admin/providers" : "account/providers") +
        "?archived=" +
        (includeArchived ? 1 : 0),
    );
    const grid = el("div", "", "ff-grid");
    target.append(grid);
    for (const p of data.items) {
      if (query && !JSON.stringify(p).toLowerCase().includes(query)) continue;
      const c = card(
        p.name,
        p.kind +
          " · " +
          (p.archived
            ? "Archived"
            : p.published
              ? "Published"
              : "Draft / review pending"),
      );
      c.append(
        el("p", p.specialty + " · " + p.area),
        action("Edit all details", () => listingEditor(p)),
      );
      const preview = el("a", "View profile", "btn btn-outline");
      preview.href = "provider-profile.html?slug=" + encodeURIComponent(p.slug);
      c.append(
        preview,
        action(p.archived ? "Restore profile" : "Archive profile", async () => {
          await api("account/providers/" + p.id + "/archive", "POST", {
            archived: !p.archived,
          });
          message(
            p.archived ? "Profile restored as draft" : "Profile archived",
          );
          await render();
        }),
      );
      if (user.role === "admin") {
        const form = el("form", "", "ff-form");
        for (const key of ["published", "verified"]) {
          const label = el(
            "label",
            key === "published" ? "Publish listing" : "Verified listing",
          );
          const input = el("input");
          input.type = "checkbox";
          input.name = key;
          input.checked = p[key];
          label.prepend(input);
          form.append(label);
        }
        const owner = dataForm([
          { key: "ownerId", label: "Owner account ID (optional)" },
        ]);
        form.append(...owner.children);
        const save = el("button", "Save approval", "btn btn-primary");
        save.type = "submit";
        form.append(save);
        form.onsubmit = async (e) => {
          e.preventDefault();
          save.disabled = true;
          try {
            await api("admin/providers/" + p.id, "PATCH", {
              published: form.elements.published.checked,
              verified: form.elements.verified.checked,
              ...(form.elements.ownerId.value.trim()
                ? { ownerId: form.elements.ownerId.value.trim() }
                : {}),
            });
            message("Approval saved");
            await render();
          } catch (err) {
            message(err.message, true);
          } finally {
            save.disabled = false;
          }
        };
        c.append(form);
      }
      grid.append(c);
    }
    if (!grid.children.length) grid.append(el("p", "No profiles yet."));
  }
  async function users(target, patientsOnly = false) {
    heading(
      target,
      patientsOnly ? "Patient accounts" : "Users and permissions",
      "Edit profile details or manage roles. Role changes require the affected user to sign in again.",
    );
    let page = 1;
    const grid = el("div", "", "ff-grid");
    target.append(grid);
    const load = async () => {
      grid.replaceChildren();
      for (const u of (await api("admin/users?page=" + page)).items) {
        if (
          (patientsOnly && u.role !== "patient") ||
          (query && !JSON.stringify(u).toLowerCase().includes(query))
        )
          continue;
        const c = card(u.name, u.email + " · " + u.role + " · " + u.status);
        c.append(
          el("small", "Account ID: " + u.id),
          action("Edit profile", () => profileWizard(u, true)),
        );
        const fields = [
          { key: "role", label: "Role", type: "select", options: schema.roles },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: ["active", "pending", "disabled"],
          },
        ];
        const form = dataForm(fields, u);
        bindSave(
          form,
          fields,
          (data) => api("admin/users/" + u.id, "PATCH", data),
          async () => {
            if (u.id === user.id) {
              const refreshed = await AuthGuard.refresh();
              if (!refreshed) {
                location.href = "auth.html";
                return;
              }
            }
            await load();
          },
        );
        c.append(form);
        grid.append(c);
      }
      if (!grid.children.length) grid.append(el("p", "No users on this page."));
    };
    target.append(
      action("Previous", async () => {
        page = Math.max(1, page - 1);
        await load();
      }),
      action("Next", async () => {
        page++;
        await load();
      }),
    );
    await load();
  }
  async function settings(target) {
    heading(target, "Account security");
    const fields = [
      {
        key: "currentPassword",
        label: "Current password",
        type: "password",
        required: true,
      },
      {
        key: "password",
        label: "New password (12+ characters)",
        type: "password",
        required: true,
      },
    ];
    const form = dataForm(fields);
    form.elements.password.minLength = 12;
    form.elements.password.maxLength = 128;
    form.elements.currentPassword.maxLength = 128;
    bindSave(
      form,
      fields,
      (data) => api("auth/password", "POST", data),
      () => form.reset(),
      "Change password",
    );
    target.append(form);
    if (user.role === "admin") {
      heading(
        target,
        "Website settings",
        "Secrets are managed in Netlify, never in browser forms.",
      );
      const data = (await api("admin/settings")).data;
      const f = dataForm(schema.settingFields, data);
      bindSave(f, schema.settingFields, (data) =>
        api("admin/settings", "PATCH", data),
      );
      target.append(f);
    }
  }
  async function overview(target) {
    heading(
      target,
      "Welcome, " + user.name,
      "Your " + user.role + " dashboard is connected to PostgreSQL.",
    );
    const grid = el("div", "", "ff-grid");
    target.append(grid);
    const p = card(
      "Profile completion",
      user.profile?.profileComplete === "yes"
        ? "Completed — update your details any time"
        : "Complete your details in guided steps",
    );
    p.append(
      action(
        "Complete / update profile",
        () => profileWizard(),
        "btn btn-primary",
      ),
    );
    grid.append(p);
    if (user.role !== "patient") {
      const data = await api(
        user.role === "admin" ? "admin/providers" : "account/providers",
      );
      const c = card(
        "Directory profiles",
        data.items.length +
          " profiles · " +
          data.items.filter((x) => x.published).length +
          " published",
      );
      c.append(action("Manage profiles", () => navigate("listings")));
      grid.append(c);
    }
    for (const [key, m] of Object.entries(schema.modules)) {
      if (!m.roles.includes(user.role)) continue;
      const data = await api("dashboard/records/" + key);
      const c = card(m.label, data.items.length + " recent records");
      c.append(action("Open", () => navigate(key)));
      grid.append(c);
    }
  }
  async function render() {
    const id = ++requestId,
      target = document.getElementById("ff-content");
    target.replaceChildren(el("p", "Loading records…"));
    const staging = el("div");
    try {
      if (active === "overview") await overview(staging);
      else if (active === "profile") {
        heading(staging, "Your profile", user.email);
        staging.append(
          action(
            "Complete / edit profile",
            () => profileWizard(),
            "btn btn-primary",
          ),
        );
        for (const [key, value] of Object.entries({
          ...user.profile,
          name: user.name,
          phone: user.phone,
        }))
          if (key !== "profileComplete")
            staging.append(el("p", key + ": " + value));
      } else if (active === "settings") await settings(staging);
      else if (active === "listings") await listings(staging);
      else if (active === "users") await users(staging);
      else if (active === "patient_accounts") await users(staging, true);
      else if (active === "audit") {
        heading(staging, "Audit log");
        for (const r of (await api("admin/audit")).items)
          staging.append(
            el("p", r.created_at + " · " + r.action + " · " + r.target_id),
          );
      } else await records(staging, active);
      if (id === requestId) target.replaceChildren(staging);
    } catch (e) {
      if (id === requestId) {
        target.replaceChildren(
          el("p", e.message, "ff-form-error"),
          action("Retry", render),
        );
      }
    }
  }
  async function navigate(key) {
    active = key;
    document
      .querySelectorAll("[data-section]")
      .forEach((b) => b.classList.toggle("active", b.dataset.section === key));
    await render();
  }
  window.addEventListener("ff-authenticated", async (event) => {
    user = event.detail;
    try {
      schema = await api("dashboard/schema");
      facilities = (await api("dashboard/facilities")).items;
      const sidebar = document.querySelector(".sidebar-nav");
      sidebar.replaceChildren();
      const nav = (key, label) => {
        const b = action(label, () => navigate(key), "nav-item");
        b.dataset.section = key;
        sidebar.append(b);
      };
      nav("overview", "Overview");
      nav("profile", "My profile");
      if (user.role !== "patient")
        nav("listings", "Doctors, labs & facilities");
      if (user.role === "admin") {
        nav("users", "Users & roles");
        nav("patient_accounts", "Patient accounts");
      }
      for (const [key, m] of Object.entries(schema.modules))
        if (m.roles.includes(user.role)) nav(key, m.label);
      if (user.role === "admin") nav("audit", "Audit log");
      nav("settings", "Settings & security");
      sidebar.append(action("Sign out", () => AuthGuard.logout(), "nav-item"));
      document.getElementById("ff-name").textContent =
        user.name + " · " + user.role;
      document.getElementById("ff-complete").onclick = () => profileWizard();
      let timer;
      document.getElementById("ff-search").oninput = (e) => {
        query = e.target.value.toLowerCase();
        clearTimeout(timer);
        timer = setTimeout(render, 250);
      };
      await navigate("overview");
      if (user.profile?.profileComplete !== "yes" && user.role !== "admin")
        await profileWizard();
    } catch (e) {
      message(e.message, true);
    }
  });
})();
