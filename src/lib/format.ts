export function fmtNumber(n: number | null | undefined, lang: "fa" | "en" = "fa") {
  if (n == null) return "—";
  return new Intl.NumberFormat(lang === "fa" ? "fa-IR" : "en-US").format(n);
}

export function fmtToman(n: number | null | undefined, lang: "fa" | "en" = "fa") {
  if (n == null) return "—";
  return `${fmtNumber(n, lang)} ${lang === "fa" ? "تومان" : "Toman"}`;
}

export function fmtDate(d: string | Date | null | undefined, lang: "fa" | "en" = "fa") {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(lang === "fa" ? "fa-IR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function fmtDateTime(d: string | Date | null | undefined, lang: "fa" | "en" = "fa") {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(lang === "fa" ? "fa-IR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
