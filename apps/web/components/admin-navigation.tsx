"use client";
import { Icon } from "./icon";
const groups = [
  {
    label: "Listings",
    icon: "hospital",
    items: [
      ["providers", "All Listings"],
      ["providers", "Hospitals", "hospital"],
      ["providers", "Clinics", "clinic"],
      ["providers", "Doctors", "doctor"],
      ["providers", "Laboratories", "lab"],
      ["claims", "Ownership Claims"],
    ],
  },
  {
    label: "Appointments",
    icon: "calendar",
    items: [
      ["appointments", "All Bookings"],
      ["slots", "Availability"],
      ["notifications", "Notifications"],
    ],
  },
  {
    label: "Payments",
    icon: "card",
    items: [
      ["invoices", "Invoices & Payments"],
      ["cms:subscriptions", "Plans & Subscriptions"],
      ["cms:refunds", "Refund Records"],
    ],
  },
  {
    label: "Blog Posts",
    icon: "file",
    items: [
      ["cms:articles", "All Posts"],
      ["blog:new", "Add Blog Post"],
      ["cms:categories", "Categories"],
      ["cms:tags", "Tags"],
    ],
  },
  {
    label: "Users",
    icon: "user",
    items: [
      ["users", "Accounts & Permissions"],
      ["profile", "My Profile"],
    ],
  },
  { label: "Reviews", icon: "star", items: [["reviews", "Patient Reviews"]] },
  {
    label: "CMS",
    icon: "file",
    items: [
      ["cms:pages", "Pages"],
      ["cms:banners", "Banners"],
      ["cms:faqs", "FAQ"],
    ],
  },
  {
    label: "Care & Services",
    icon: "lab",
    items: [
      ["services", "Services & Tests"],
      ["records", "Care Records & Messages"],
      ["cms:admissions", "Admissions"],
    ],
  },
];
export function AdminNavigation({
  active,
  kind,
  onSelect,
}: {
  active: string;
  kind: string;
  onSelect: (tab: string, query?: string) => void;
}) {
  return (
    <nav className="admin-navigation" aria-label="Administrator navigation">
      <button
        className={active === "overview" ? "active" : ""}
        onClick={() => onSelect("overview")}
      >
        <Icon name="home" />
        Dashboard
      </button>
      {groups.map((g) => (
        <details key={g.label} open>
          <summary>
            <Icon name={g.icon} />
            {g.label}
            <span>⌄</span>
          </summary>
          <div>
            {g.items.map(([key, label, query]) => (
              <button
                key={label}
                className={
                  active === key && (query || "") === kind ? "selected" : ""
                }
                onClick={() => onSelect(key, query)}
              >
                {label}
              </button>
            ))}
          </div>
        </details>
      ))}
      <button
        className={active === "settings" ? "active" : ""}
        onClick={() => onSelect("settings")}
      >
        <Icon name="settings" />
        Settings
      </button>
    </nav>
  );
}
