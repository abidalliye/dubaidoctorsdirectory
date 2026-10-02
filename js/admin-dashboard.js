/* Admin presentation layer: all numbers and records come from authenticated APIs. */
window.HealthDirAdmin = (() => {
  let c,
    latest,
    from = new Date().toISOString().slice(0, 8) + "01",
    to = new Date().toISOString().slice(0, 10),
    searchSequence = 0;
  const money = (n) =>
    "AED " +
    Number(n || 0).toLocaleString("en-AE", { maximumFractionDigits: 2 });
  const count = (rows) => rows.reduce((n, r) => n + Number(r.count), 0);
  const icons = {
    overview: "⌂",
    listings: "▧",
    appointments: "▦",
    payments: "▣",
    articles: "▤",
    users: "♙",
    reviews: "☆",
    pages: "▥",
    settings: "⚙",
  };
  function icon(type) {
    const paths = {
      overview: "M3 11 12 3l9 8M5 10v11h5v-7h4v7h5V10",
      listings: "M4 21V6h10v15M14 10h6v11M7 9h4M7 13h4M7 17h4M17 13h1M17 17h1",
      appointments:
        "M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2ZM7 2v4M17 2v4M3 9h18M7 13h2M12 13h2M7 17h2M12 17h2",
      payments: "M4 5h16v14H4ZM4 10h16M7 15h4",
      articles: "M6 3h9l4 4v14H6ZM14 3v5h5M9 12h7M9 16h7",
      users:
        "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-3a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v3Z",
      lab: "M9 3h6M10 3v7L4 20h16l-6-10V3M8 15h8",
      reviews: "m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z",
      settings:
        "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2",
      bell: "M5 17h14l-2-3V8a5 5 0 0 0-10 0v6ZM10 20h4",
    };
    const n = c.el("span");
    n.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' +
      (paths[type] || paths.listings) +
      '"/></svg>';
    return n.firstChild;
  }
  function go(key, filter = "") {
    c.setQuery(filter);
    return c.navigate(key);
  }
  function setup(context) {
    c = context;
    const { el, action } = c,
      nav = document.querySelector(".sidebar-nav");
    nav.replaceChildren();
    function link(key, label, filter = "") {
      const b = action(label, () => go(key, filter), "nav-item");
      b.textContent = label.replace(/^[^a-zA-Z]+/, "");
      b.prepend(icon(key));
      b.dataset.section = key;
      nav.append(b);
      return b;
    }
    link("overview", "⌂  Dashboard");
    function group(label, key, items) {
      const details = el("details", "", "hd-nav-group");
      details.open = ["Listings", "Appointments"].includes(label);
      const summary = el("summary", (icons[key] || "▤") + "  " + label);
      summary.textContent = label;
      summary.prepend(icon(key));
      details.append(summary);
      for (const [section, title, filter] of items) {
        const b = action(
          title,
          () => go(section, filter || ""),
          "nav-item hd-subnav",
        );
        b.dataset.section = section;
        details.append(b);
      }
      nav.append(details);
    }
    group("Listings", "listings", [
      ["listings", "All listings"],
      ["listings", "Hospitals", "hospital"],
      ["listings", "Clinics", "clinic"],
      ["listings", "Doctors", "doctor"],
      ["listings", "Laboratories", "lab"],
      ["listings", "Surgeons", "surgeon"],
      ["listings", "Technicians", "technician"],
    ]);
    group("Appointments", "appointments", [
      ["appointments", "All bookings"],
      [
        "appointments",
        "Today’s appointments",
        new Date().toISOString().slice(0, 10),
      ],
      ["calendar", "Calendar"],
      ["notifications", "Notifications"],
    ]);
    group("Payments", "payments", [
      ["payments", "Transactions"],
      ["subscriptions", "Plans & subscriptions"],
      ["payments", "Invoices"],
      ["refunds", "Refunds"],
    ]);
    group("Blog Posts", "articles", [
      ["articles", "All posts"],
      ["categories", "Categories"],
      ["tags", "Tags"],
    ]);
    group("Users", "users", [
      ["users", "All users & permissions"],
      ["patient_accounts", "Patients / visitors"],
      ["users", "Doctors & clinics", "doctor"],
    ]);
    group("Reviews", "reviews", [
      ["reviews", "All reviews"],
      ["reviews", "Pending moderation", "Pending"],
      ["reviews", "Hidden reviews", "Hidden"],
    ]);
    group("CMS", "pages", [
      ["pages", "Pages"],
      ["banners", "Banners"],
      ["faqs", "FAQ"],
    ]);
    group(
      "Care records",
      "notes",
      Object.entries(c.schema.modules)
        .filter(([k]) =>
          [
            "admissions",
            "notes",
            "prescriptions",
            "lab_requests",
            "documents",
            "tariffs",
            "schedules",
            "saved_providers",
            "patients",
          ].includes(k),
        )
        .map(([k, m]) => [k, m.label]),
    );
    link("audit", "▤  Audit log");
    link("settings", "⚙  Settings");
    link("profile", "♙  My profile");
    nav.append(action("Sign out", () => AuthGuard.logout(), "nav-item"));
    document
      .getElementById("ff-name")
      .replaceChildren(el("strong", c.user.name), el("small", "Super Admin"));
    document.querySelector(".hd-avatar").textContent = c.user.name
      .slice(0, 1)
      .toUpperCase();
    document.getElementById("hd-account").onclick = () => {
      const d = c.modal("Your account");
      d.append(
        action("Update profile", () => {
          d.close();
          return c.profileWizard();
        }),
        action("Settings & password", () => {
          d.close();
          return go("settings");
        }),
        action("Sign out", () => AuthGuard.logout()),
      );
    };
    document.getElementById("hd-notifications").onclick = () =>
      go("notifications");
    document
      .getElementById("hd-notifications")
      .replaceChildren(icon("bell"), document.getElementById("hd-unread"));
    let timer;
    const search = document.getElementById("ff-search"),
      results = document.getElementById("hd-search-results");
    search.oninput = () => {
      clearTimeout(timer);
      const q = search.value.trim(),
        id = ++searchSequence;
      results.replaceChildren();
      results.hidden = true;
      if (q.length < 2) return;
      timer = setTimeout(async () => {
        try {
          const data = await c.api("admin/search?q=" + encodeURIComponent(q));
          if (id !== searchSequence) return;
          results.hidden = false;
          for (const r of data.items)
            results.append(
              action(
                r.label + " · " + r.detail,
                () => {
                  results.hidden = true;
                  return go(r.section, r.label);
                },
                "hd-result",
              ),
            );
          if (!data.items.length)
            results.append(el("p", "No matching records"));
        } catch (e) {
          c.message(e.message, true);
        }
      }, 300);
    };
  }
  function panel(title, section) {
    const box = c.el("section", "", "hd-panel"),
      head = c.el("header", "", "hd-panel-head");
    head.append(c.el("h3", title));
    if (section)
      head.append(c.action("View All", () => go(section), "hd-link"));
    box.append(head);
    return box;
  }
  function empty(target, text = "No records yet") {
    target.append(c.el("div", text, "hd-empty"));
  }
  function table(target, headers, rows, fields, key) {
    const wrap = c.el("div", "", "hd-table-wrap"),
      t = c.el("table", "", "hd-table"),
      head = c.el("tr");
    headers.forEach((h) => head.append(c.el("th", h)));
    const thead = c.el("thead");
    thead.append(head);
    t.append(thead);
    const body = c.el("tbody");
    for (const r of rows) {
      const tr = c.el("tr");
      fields.forEach((f) => {
        const value = f(r),
          td = c.el("td");
        if (f.status)
          td.append(
            c.el(
              "span",
              value || "—",
              "hd-status " + (value || "").toLowerCase(),
            ),
          );
        else td.textContent = value || "—";
        tr.append(td);
      });
      const edit = c.el("td");
      edit.append(c.action("•••", () => c.recordEditor(key, r), "hd-link"));
      tr.append(edit);
      body.append(tr);
    }
    t.append(body);
    wrap.append(t);
    target.append(wrap);
    if (!rows.length) empty(target);
  }
  const status = (r) => r.data.status;
  status.status = true;
  function period(section = "overview") {
    const tools = c.el("div", "", "hd-period");
    for (const [label, value, set] of [
      ["From", from, (v) => (from = v)],
      ["To", to, (v) => (to = v)],
    ]) {
      const l = c.el("label", label),
        input = c.el("input");
      input.type = "date";
      input.value = value;
      input.onchange = () => set(input.value);
      l.append(input);
      tools.append(l);
    }
    tools.append(c.action("Apply", () => go(section), "hd-apply"));
    return tools;
  }
  function svg(markup) {
    const container = c.el("div", "", "hd-chart");
    container.innerHTML = markup;
    return container;
  }
  function bars(rows) {
    const dates = [...new Set(rows.map((r) => r.date))],
      max = Math.max(
        1,
        ...dates.map((d) => count(rows.filter((r) => r.date === d))),
      );
    if (!dates.length)
      return svg(
        '<svg viewBox="0 0 450 170" role="img" aria-label="No bookings in selected period"><path d="M25 20V145H435" fill="none" stroke="#dae3ee"/><text x="225" y="85" text-anchor="middle" fill="#728398" font-size="12">No bookings in selected period</text></svg>',
      );
    let m =
      '<svg viewBox="0 0 450 170" role="img" aria-label="Daily bookings by status">';
    for (let i = 0; i < 4; i++)
      m += `<path d="M25 ${25 + i * 40}H435" stroke="#edf2f7"/><text x="20" y="${29 + i * 40}" text-anchor="end" font-size="9" fill="#728398">${Math.round((max * (3 - i)) / 3)}</text>`;
    dates.forEach((d, i) => {
      let y = 145;
      for (const [state, color] of [
        ["Cancelled", "#fa4c87"],
        ["Requested", "#45baf5"],
        ["Confirmed", "#147cff"],
        ["Completed", "#00a578"],
      ]) {
        const n = count(rows.filter((r) => r.date === d && r.status === state)),
          h = (n / max) * 120;
        y -= h;
        m += `<rect x="${30 + (i * 400) / dates.length}" y="${y}" width="${Math.max(2, Math.min(20, 300 / dates.length))}" height="${h}" fill="${color}"><title>${d} ${state}: ${n}</title></rect>`;
      }
    });
    m += `<text x="25" y="164" fill="#64748b" font-size="10">${dates[0]}</text><text x="435" y="164" text-anchor="end" fill="#64748b" font-size="10">${dates.at(-1)}</text></svg>`;
    return svg(m);
  }
  function line(rows) {
    const max = Math.max(1, ...rows.map((r) => Number(r.amount)));
    let m =
      '<svg viewBox="0 0 400 170" role="img" aria-label="Recorded paid revenue by day">';
    for (let i = 0; i < 4; i++)
      m += `<path d="M35 ${25 + i * 40}H390" stroke="#edf2f7"/><text x="30" y="${29 + i * 40}" text-anchor="end" font-size="9" fill="#728398">${Math.round((max * (3 - i)) / 3)}</text>`;
    if (rows.length) {
      const points = rows
        .map(
          (r, i) =>
            `${35 + (i * 350) / Math.max(1, rows.length - 1)},${145 - (Number(r.amount) / max) * 120}`,
        )
        .join(" ");
      m += `<polygon points="35,145 ${points} 385,145" fill="#00b56b22"/><polyline points="${points}" stroke="#00ab60" stroke-width="2.5" fill="none"/>`;
      rows.forEach(
        (r, i) =>
          (m += `<circle cx="${35 + (i * 350) / Math.max(1, rows.length - 1)}" cy="${145 - (Number(r.amount) / max) * 120}" r="3" fill="#00ab60"><title>${r.date}: ${money(r.amount)}</title></circle>`),
      );
    } else
      m +=
        '<text x="215" y="85" text-anchor="middle" fill="#728398" font-size="12">No paid revenue in selected period</text>';
    return svg(m + "</svg>");
  }
  async function overview(target) {
    const data = await c.api("admin/overview?from=" + from + "&to=" + to);
    latest = data;
    data.listings.sort(
      (a, b) =>
        [
          "doctor",
          "clinic",
          "hospital",
          "lab",
          "surgeon",
          "technician",
        ].indexOf(a.kind) -
        [
          "doctor",
          "clinic",
          "hospital",
          "lab",
          "surgeon",
          "technician",
        ].indexOf(b.kind),
    );
    await refreshNotifications();
    const title = c.el("div", "", "hd-title"),
      copy = c.el("div");
    copy.append(
      c.el("h1", "Dashboard"),
      c.el(
        "p",
        `Welcome back, ${c.user.name}! Here’s what’s happening with your doctors directory.`,
      ),
    );
    title.append(
      copy,
      period(),
      c.action(
        "＋ Add New",
        () => {
          const d = c.modal("Add a new record");
          quickActions(d);
        },
        "btn btn-primary",
      ),
    );
    target.append(title);
    const metrics = c.el("div", "", "hd-metrics");
    target.append(metrics);
    const paid = data.payments
      .filter((r) => r.status === "Paid")
      .reduce((n, r) => n + Number(r.amount), 0);
    for (const [symbol, value, label, detail, key, color] of [
      [
        "♙",
        count(data.listings).toLocaleString(),
        "Total Listings",
        data.listings.map((r) => r.count + " " + r.kind).join("  ·  "),
        "listings",
        "blue",
      ],
      [
        "▦",
        count(data.bookings).toLocaleString(),
        "Total Bookings",
        data.bookings.map((r) => r.count + " " + r.status).join("  ·  ") ||
          "Selected period",
        "appointments",
        "teal",
      ],
      [
        "▣",
        money(paid),
        "Recorded Paid Revenue",
        count(data.payments) + " payment records · selected period",
        "payments",
        "purple",
      ],
      [
        "▤",
        count(data.articles).toLocaleString(),
        "Blog Posts",
        data.articles.map((r) => r.count + " " + r.status).join("  ·  ") ||
          "No articles yet",
        "articles",
        "orange",
      ],
    ]) {
      const b = c.action("", () => go(key), "hd-metric"),
        icon = c.el("span", symbol, "hd-metric-icon " + color),
        text = c.el("div");
      text.append(c.el("strong", value), c.el("span", label));
      b.append(icon, text, c.el("small", detail));
      icon.replaceChildren(
        window.HealthDirAdmin.makeIcon(key === "listings" ? "users" : key),
      );
      metrics.append(b);
    }
    const charts = c.el("div", "", "hd-charts"),
      booking = panel("Bookings Overview"),
      rev = panel("Revenue Overview (AED)"),
      types = panel("Listings by Type");
    const bookingLegend = c.el("p", "", "hd-legend");
    for (const [label, color] of [
      ["Confirmed", "#147cff"],
      ["Requested", "#45baf5"],
      ["Cancelled", "#fa4c87"],
      ["Completed", "#00a578"],
    ]) {
      const item = c.el("span", label),
        dot = c.el("i");
      dot.style.background = color;
      item.prepend(dot);
      bookingLegend.append(item);
    }
    booking.append(bookingLegend, bars(data.trend));
    rev.append(
      c.el("p", "Paid records · selected period", "hd-legend"),
      line(data.revenue),
    );
    const total = count(data.listings),
      colors = [
        "#087cff",
        "#1cb8ef",
        "#f74d86",
        "#ff9c23",
        "#8454e9",
        "#08a780",
      ];
    let angle = 0;
    const stops = data.listings.map((r, i) => {
      const start = angle;
      angle += (r.count / Math.max(1, total)) * 100;
      return `${colors[i % colors.length]} ${start}% ${angle}%`;
    });
    const donut = c.el("div", "", "hd-donut");
    donut.style.background = total
      ? "conic-gradient(" + stops.join(",") + ")"
      : "#e8eef5";
    const center = c.el("div");
    center.append(
      c.el("strong", total.toLocaleString()),
      c.el("small", "Total Listings"),
    );
    donut.append(center);
    const legend = c.el("div", "", "hd-type-legend");
    data.listings.forEach((r, i) => {
      const b = c.action("", () => go("listings", r.kind), "hd-type-row"),
        dot = c.el("i");
      dot.style.background = colors[i % colors.length];
      b.append(
        dot,
        c.el("span", r.kind),
        c.el(
          "strong",
          r.count +
            " (" +
            Math.round((r.count / Math.max(1, total)) * 100) +
            "%)",
        ),
      );
      legend.append(b);
    });
    const typebody = c.el("div", "", "hd-types");
    typebody.append(donut, legend);
    types.append(typebody);
    charts.append(booking, rev, types);
    target.append(charts);
    const middle = c.el("div", "", "hd-middle"),
      book = panel("Recent Bookings", "appointments"),
      payment = panel("Recent Payments", "payments"),
      side = c.el("div", "", "hd-side");
    table(
      book,
      ["#", "Patient Name", "Doctor", "Type", "Date & Time", "Status", ""],
      data.recentBookings,
      [
        (r) => "#" + r.id.slice(0, 6),
        (r) => r.data.patientName,
        (r) => r.data.doctorName,
        (r) => r.data.consultType,
        (r) => [r.data.date, r.data.timeSlot].filter(Boolean).join(" "),
        status,
      ],
      "appointments",
    );
    table(
      payment,
      ["#", "Customer", "Amount", "Method", "Status", ""],
      data.recentPayments,
      [
        (r) => r.data.reference,
        (r) => r.data.patientName,
        (r) => money(r.data.amount),
        (r) => r.data.method,
        status,
      ],
      "payments",
    );
    const quick = panel("Quick Actions");
    quickActions(quick);
    const system = panel("System Status", "settings");
    data.system.forEach((r) => {
      const row = c.el("div", "", "hd-system-row");
      row.append(
        c.el("i", "", r.ok ? "hd-dot good" : "hd-dot pending"),
        c.el("span", r.name),
        c.el("small", r.state),
      );
      system.append(row);
    });
    side.append(quick, system);
    middle.append(book, payment, side);
    target.append(middle);
    const bottom = c.el("div", "", "hd-bottom"),
      top = panel("Top Doctors by Bookings", "appointments"),
      places = panel("Top Locations", "listings"),
      blog = panel("Recent Blog Posts", "articles");
    rank(top, data.doctors, "appointments");
    rank(places, data.locations, "listings");
    table(
      blog,
      ["Title", "Category", "Status", "Updated", ""],
      data.recentArticles,
      [
        (r) => r.data.title,
        (r) => r.data.category,
        status,
        (r) => new Date(r.updated_at).toLocaleDateString(),
      ],
      "articles",
    );
    bottom.append(top, places, blog);
    target.append(bottom);
  }
  function quickActions(target) {
    const grid = c.el("div", "", "hd-quick");
    for (const [label, kind] of [
      ["♙ Add Doctor", "doctor"],
      ["♧ Add Clinic", "clinic"],
      ["▥ Add Hospital", "hospital"],
      ["⚗ Add Lab", "lab"],
    ]) {
      const button = c.action(
        label,
        () => c.listingEditor(undefined, kind),
        "hd-quick-button",
      );
      button.textContent = label.replace(/^[^a-zA-Z]+/, "");
      button.prepend(
        icon(kind === "lab" ? "lab" : kind === "doctor" ? "users" : "listings"),
      );
      grid.append(button);
    }
    grid.append(
      c.action(
        "▦ New Booking",
        () => c.recordEditor("appointments"),
        "hd-quick-button",
      ),
      c.action(
        "▤ Add Blog Post",
        () => c.recordEditor("articles"),
        "hd-quick-button",
      ),
    );
    for (const [button, type] of [
      [grid.children[4], "appointments"],
      [grid.children[5], "articles"],
    ]) {
      button.textContent = button.textContent.replace(/^[^a-zA-Z]+/, "");
      button.prepend(icon(type));
    }
    target.append(grid);
  }
  function rank(target, rows, key) {
    if (!rows.length) return empty(target, "No ranking data yet");
    const max = Math.max(...rows.map((r) => r.count));
    rows.forEach((r, i) => {
      const b = c.action("", () => go(key, r.name), "hd-rank");
      b.append(
        c.el("span", String(i + 1), "hd-rank-avatar"),
        c.el("span", r.name),
        c.el("strong", r.count),
      );
      const bar = c.el("div", "", "hd-track"),
        fill = c.el("i");
      fill.style.width = (r.count / max) * 100 + "%";
      bar.append(fill);
      b.append(bar);
      target.append(b);
    });
  }
  async function calendar(target) {
    const data = await c.api("admin/overview?from=" + from + "&to=" + to);
    const head = c.el("div", "", "hd-title");
    head.append(
      c.el("h1", "Appointment Calendar"),
      period("calendar"),
      c.action(
        "New booking",
        () => c.recordEditor("appointments"),
        "btn btn-primary",
      ),
    );
    target.append(head);
    const grid = c.el("div", "", "hd-calendar");
    for (
      let day = new Date(from + "T12:00:00Z");
      day <= new Date(to + "T12:00:00Z");
      day.setUTCDate(day.getUTCDate() + 1)
    ) {
      const date = day.toISOString().slice(0, 10),
        rows = data.trend.filter((r) => r.date === date),
        b = c.action("", () => go("appointments", date), "hd-calendar-day");
      b.append(
        c.el(
          "strong",
          day.toLocaleDateString("en", {
            weekday: "short",
            month: "short",
            day: "numeric",
            timeZone: "UTC",
          }),
        ),
        c.el("span", count(rows) + " bookings"),
      );
      rows.forEach((r) => b.append(c.el("small", r.count + " " + r.status)));
      grid.append(b);
    }
    target.append(grid);
  }
  async function refreshNotifications() {
    const data = await c.api("admin/notification-count");
    document.getElementById("hd-unread").textContent = data.count;
  }
  return { setup, overview, calendar, makeIcon: icon, refreshNotifications };
})();
