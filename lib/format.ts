import { MONTH_NAMES, parseMonthKey } from "./dates";

export function money(n: number): string {
  return "₱" + Math.round(n).toLocaleString("en-US");
}

export function moneyK(n: number): string {
  if (n >= 1_000_000) return "₱" + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return "₱" + Math.round(n / 1_000) + "k";
  return "₱" + Math.round(n);
}

export function num(n: number): string {
  return n.toLocaleString("en-US");
}

/** "Jun 7" from a "YYYY-MM-DD" date string. */
export function dateLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return MONTH_NAMES[d.getUTCMonth()].slice(0, 3) + " " + d.getUTCDate();
}

/** "Sunday · June 7" from a "YYYY-MM-DD" date string. */
export function formDateLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return "Sunday · " + MONTH_NAMES[d.getUTCMonth()] + " " + d.getUTCDate();
}

/** "Jun" from a "YYYY-MM" monthKey. */
export function monthShort(monthKey: string): string {
  const { month } = parseMonthKey(monthKey);
  return MONTH_NAMES[month - 1].slice(0, 3);
}

/** "June 2026" from a "YYYY-MM" monthKey — always derived, never stored. */
export function monthLabel(monthKey: string): string {
  const { year, month } = parseMonthKey(monthKey);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}
