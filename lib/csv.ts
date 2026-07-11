// CSV template parsing/generation — ported faithfully from the design prototype
// (Church Data Portal.dc.html, parseCSV/parseLine/templateText/sampleText).
//
// Pure string-in/object-out, zero DOM dependency: this same module powers the
// client-side instant preview AND the mandatory server-side re-validation on
// confirm. Never trust the client's already-parsed object — always re-parse
// the raw text server-side.

import { MONTH_NAMES, sundays } from "./dates";
import { MAX_GIVING, MAX_HEADCOUNT } from "./limits";
import type { ParsedSubmission } from "./types";

export type ParseResult =
  | { ok: true; data: ParsedSubmission }
  | { ok: false; errors: string[] };

/** Quoted-field-aware CSV line parser (handles "" as an escaped quote). */
export function parseLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          q = false;
        }
      } else {
        cur += c;
      }
    } else {
      if (c === '"') q = true;
      else if (c === ",") {
        out.push(cur);
        cur = "";
      } else cur += c;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export function parseCSV(text: string): ParseResult {
  const errors: string[] = [];
  const raw = text.replace(/\r\n?/g, "\n").split("\n");
  const rows = raw.map((l) => parseLine(l));

  const findKV = (label: string): string => {
    for (const r of rows) {
      if (r[0] && r[0].toLowerCase().replace(":", "").trim() === label) {
        return (r[1] || "").trim();
      }
    }
    return "";
  };

  const church = findKV("church name");
  const monthStr = findKV("report month") || findKV("month");

  let headerIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    if ((rows[i][0] || "").toLowerCase().startsWith("sunday date")) {
      headerIdx = i;
      break;
    }
  }

  if (!church) {
    errors.push('Missing "Church Name:" — please fill in your local church name near the top.');
  }

  let monthKey = "";
  if (!monthStr) {
    errors.push('Missing "Report Month:" — please enter the month, e.g. "June 2026".');
  } else {
    const mp = monthStr.match(/([A-Za-z]+)\s+(\d{4})/);
    if (mp) {
      const mi = MONTH_NAMES.findIndex((n) => n.toLowerCase() === mp[1].toLowerCase());
      if (mi >= 0) {
        monthKey = mp[2] + "-" + String(mi + 1).padStart(2, "0");
      }
    }
    if (!monthKey) {
      errors.push(`Could not read the month "${monthStr}". Use a format like "June 2026".`);
    }
  }

  if (headerIdx < 0) {
    errors.push('Missing the WEEKLY DATA table header row ("Sunday Date, Regulars, ...").');
  }

  const weeks: ParsedSubmission["weeks"] = [];
  const seenDates = new Set<string>();
  if (headerIdx >= 0) {
    for (let i = headerIdx + 1; i < rows.length; i++) {
      const r = rows[i];
      const first = (r[0] || "").toLowerCase();
      if (!r[0] || first.startsWith("wins") || first.startsWith("challenges")) break;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(r[0])) {
        errors.push(`Row "${r[0]}" has an invalid Sunday date. Use YYYY-MM-DD (e.g. 2026-06-07).`);
        continue;
      }
      const parsedDate = new Date(r[0] + "T00:00:00Z");
      if (isNaN(parsedDate.getTime())) {
        errors.push(`Row "${r[0]}" is not a real calendar date.`);
        continue;
      }
      if (parsedDate.getUTCDay() !== 0) {
        errors.push(`Row "${r[0]}" is not a Sunday — check the date.`);
        continue;
      }
      if (monthKey && r[0].slice(0, 7) !== monthKey) {
        errors.push(`Row "${r[0]}" isn't in ${monthStr || "the reported month"} — check the date or the Report Month field.`);
        continue;
      }
      if (seenDates.has(r[0])) {
        errors.push(`Sunday ${r[0]} appears more than once in the WEEKLY DATA table.`);
        continue;
      }
      seenDates.add(r[0]);

      const rn = (v: string | undefined, name: string, opts: { integer?: boolean; max: number }): number | null => {
        const x = (v || "").replace(/[,\s₱]/g, "");
        if (x === "" || isNaN(Number(x))) {
          errors.push(`Sunday ${r[0]}: "${name}" must be a number (got "${v || "blank"}").`);
          return null;
        }
        const n = Number(x);
        if (n < 0) {
          errors.push(`Sunday ${r[0]}: "${name}" can't be negative.`);
          return null;
        }
        if (opts.integer && !Number.isInteger(n)) {
          errors.push(`Sunday ${r[0]}: "${name}" must be a whole number.`);
          return null;
        }
        if (n > opts.max) {
          errors.push(`Sunday ${r[0]}: "${name}" is too large.`);
          return null;
        }
        return n;
      };
      const regulars = rn(r[1], "Regulars", { integer: true, max: MAX_HEADCOUNT });
      const vip = rn(r[2], "First Timers (VIP)", { integer: true, max: MAX_HEADCOUNT });
      const giving = rn(r[3], "Tithes & Offering", { max: MAX_GIVING });
      const sermon = (r[4] || "").trim();
      if (!sermon) {
        errors.push(`Sunday ${r[0]}: please add the sermon title.`);
        continue;
      }
      if (regulars === null || vip === null || giving === null) continue;
      weeks.push({ date: r[0], regulars, vip, giving, sermon, preacher: r[5] || "—" });
    }
  }
  if (headerIdx >= 0 && weeks.length === 0 && errors.length === 0) {
    errors.push("No Sunday data found. Please fill in at least one Sunday row.");
  }

  const block = (label: string): string => {
    let start = -1;
    for (let i = 0; i < rows.length; i++) {
      if ((rows[i][0] || "").toLowerCase().trim() === label) {
        start = i;
        break;
      }
    }
    if (start < 0) return "";
    const parts: string[] = [];
    for (let i = start + 1; i < rows.length; i++) {
      const f = (rows[i][0] || "").toLowerCase().trim();
      if (f === "wins" || f === "challenges") break;
      if (rows[i][0]) parts.push(rows[i][0].trim());
    }
    return parts.join(" ").replace(/^"|"$/g, "").trim();
  };

  let wins = block("wins");
  let challenges = block("challenges");
  if (/^describe your local church/i.test(wins)) wins = "";
  if (/^describe your local church/i.test(challenges)) challenges = "";
  if (!wins) errors.push("The WINS section is empty — please share at least one win for the month.");
  if (!challenges) errors.push("The CHALLENGES section is empty — please share at least one challenge for the month.");

  if (errors.length) return { ok: false, errors };
  return { ok: true, data: { church, monthKey, weeks, wins, challenges } };
}

export function templateText(): string {
  const lines: string[] = [];
  lines.push("His Presence Church International - Monthly Local Church Report");
  lines.push("");
  lines.push("Church Name:,HPCI North Caloocan");
  lines.push("Report Month:,June 2026");
  lines.push("");
  lines.push("WEEKLY DATA");
  lines.push("Sunday Date,Regulars,First Timers (VIP),Tithes & Offering (PHP),Sermon Title,Preacher");
  sundays(2026, 6).forEach((d) => lines.push(d + ",,,,,"));
  lines.push("");
  lines.push("WINS");
  lines.push('"Describe your local church wins for the month here"');
  lines.push("");
  lines.push("CHALLENGES");
  lines.push('"Describe your local church challenges for the month here"');
  lines.push("");
  return lines.join("\n");
}

export function sampleText(): string {
  const lines: string[] = [];
  lines.push("His Presence Church International - Monthly Local Church Report");
  lines.push("");
  lines.push("Church Name:,HPCI Johanan");
  lines.push("Report Month:,June 2026");
  lines.push("");
  lines.push("WEEKLY DATA");
  lines.push("Sunday Date,Regulars,First Timers (VIP),Tithes & Offering (PHP),Sermon Title,Preacher");
  const rows: [string, number, number, number, string, string][] = [
    ["2026-06-07", 132, 9, 51000, "Carriers of His Presence", "Ptr. Grace Lim"],
    ["2026-06-14", 138, 6, 54300, "Overflow", "Ps. Jonan Dela Cruz"],
    ["2026-06-21", 129, 11, 48900, "The Blessed Life", "Ptr. Grace Lim"],
    ["2026-06-28", 145, 7, 57900, "Greater Things Ahead", "Bishop Ariel Marquez"],
  ];
  rows.forEach((r) => lines.push(r.join(",")));
  lines.push("");
  lines.push("WINS");
  lines.push(
    '"9 first timers this month and 4 signed up for the discipleship track. Youth service relaunched with a full worship team."'
  );
  lines.push("");
  lines.push("CHALLENGES");
  lines.push(
    '"Kids ministry is short two volunteers after graduation season. Looking for a larger venue as Sundays are near capacity."'
  );
  lines.push("");
  return lines.join("\n");
}
