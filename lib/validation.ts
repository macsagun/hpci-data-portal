// Guided-form validation — ported faithfully from the design prototype's
// submitForm() (Church Data Portal.dc.html). Runs server-side only; the form
// UI may show lightweight inline hints, but this is the single source of
// truth for what's allowed to reach the pending queue.

import { dateLabel } from "./format";
import { sundays } from "./dates";
import type { ParsedSubmission, Week } from "./types";

export type WeekFieldInput = {
  regulars?: string;
  vip?: string;
  giving?: string;
  sermon?: string;
  preacher?: string;
};

export type WeekFormInput = {
  church: string;
  year: string;
  month: string;
  values: Record<string, WeekFieldInput>;
  wins: string;
  challenges: string;
};

export type ValidateResult =
  | { ok: true; data: ParsedSubmission }
  | { ok: false; errors: string[] };

export function validateWeekForm(f: WeekFormInput): ValidateResult {
  const errs: string[] = [];

  if (!f.church) errs.push("Please select your local church.");

  const year = Number(f.year);
  const month = Number(f.month);
  if (!f.year || !f.month || isNaN(year) || isNaN(month)) {
    errs.push("Please select a month and year.");
    return { ok: false, errors: errs };
  }

  const dates = sundays(year, month);
  const weeks: Week[] = [];

  dates.forEach((d) => {
    const v = f.values[d] || {};
    const filled = (["regulars", "vip", "giving", "sermon", "preacher"] as const).some(
      (k) => v[k] != null && String(v[k]).trim() !== ""
    );
    if (!filled) return;

    const nf = (k: "regulars" | "vip" | "giving", label: string): number | null => {
      const x = v[k];
      if (x == null || String(x).trim() === "" || isNaN(Number(x))) {
        errs.push(`${dateLabel(d)}: "${label}" needs a number.`);
        return null;
      }
      if (Number(x) < 0) {
        errs.push(`${dateLabel(d)}: "${label}" can't be negative.`);
        return null;
      }
      return Number(x);
    };

    const regulars = nf("regulars", "Regulars");
    const vip = nf("vip", "First Timers (VIP)");
    const giving = nf("giving", "Tithes & Offering");
    const sermon = (v.sermon || "").trim();
    if (!sermon) errs.push(`${dateLabel(d)}: please add the sermon title.`);
    if (regulars === null || vip === null || giving === null || !sermon) return;

    weeks.push({
      date: d,
      regulars,
      vip,
      giving,
      sermon,
      preacher: (v.preacher || "").trim() || "—",
    });
  });

  if (weeks.length === 0) errs.push("Please fill in at least one Sunday.");
  if (!f.wins.trim()) errs.push("Please share at least one win for the month.");
  if (!f.challenges.trim()) errs.push("Please share at least one challenge for the month.");

  if (errs.length) return { ok: false, errors: errs };

  const monthKey = `${f.year}-${String(month).padStart(2, "0")}`;
  return {
    ok: true,
    data: { church: f.church, monthKey, weeks, wins: f.wins.trim(), challenges: f.challenges.trim() },
  };
}
