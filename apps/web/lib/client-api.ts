export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  profile: Record<string, string>;
};
export async function api(path: string, method = "GET", body?: unknown) {
  const csrf =
    typeof document === "undefined"
      ? ""
      : document.cookie
          .split("; ")
          .find((c) => c.startsWith("ff_csrf="))
          ?.slice(8) || "";
  const r = await fetch("/v1/" + path, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "FertiFind",
      ...(method !== "GET" ? { "X-CSRF-Token": csrf } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await r
    .json()
    .catch(() => ({ message: "Unable to read server response" }));
  if (!r.ok)
    throw new Error(
      Array.isArray(data.message)
        ? data.message.join(", ")
        : data.message || "Request failed",
    );
  return data;
}
export function shortPrompt(label: string) {
  return label
    .replace(/\([^)]*\)/g, "")
    .replace(/\s*\/.*$/, "")
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join(" ");
}
export function formatMoney(minor: number) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
  }).format(minor / 100);
}
export function localTime(value: string) {
  return new Date(value).toLocaleString("en-AE", {
    timeZone: "Asia/Dubai",
    dateStyle: "medium",
    timeStyle: "short",
  });
}
