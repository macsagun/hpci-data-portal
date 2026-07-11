export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Every Sunday (YYYY-MM-DD, UTC) in the given month. */
export function sundays(year: number, month: number): string[] {
  const res: string[] = [];
  const d = new Date(Date.UTC(year, month - 1, 1));
  while (d.getUTCMonth() === month - 1) {
    if (d.getUTCDay() === 0) res.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return res;
}

/** The real current date, isolated to one seam so nothing hardcodes a fake "today". */
export function serverToday(): Date {
  return new Date();
}

export function isFutureMonth(year: number, month: number): boolean {
  const today = serverToday();
  const curY = today.getUTCFullYear();
  const curM = today.getUTCMonth() + 1;
  return year > curY || (year === curY && month > curM);
}

export function monthKeyOf(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function parseMonthKey(monthKey: string): { year: number; month: number } {
  const [y, m] = monthKey.split("-");
  return { year: Number(y), month: Number(m) };
}
