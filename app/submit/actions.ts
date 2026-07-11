"use server";

import { validateWeekForm, type WeekFormInput } from "@/lib/validation";
import { parseCSV } from "@/lib/csv";
import { routeSubmission, getLiveSubmission } from "@/lib/submissions";
import { monthLabel as formatMonthLabel } from "@/lib/format";
import type { ParsedSubmission } from "@/lib/types";

export type SubmitResult = { ok: false; errors: string[] } | { ok: true; church: string; monthLabel: string };

const GENERIC_SAVE_ERROR = [
  "Something went wrong saving your report. Please try again in a moment — if it keeps happening, let your admin know.",
];

/** Guided-form submit. Always routes to the pending queue — never writes live data directly. */
export async function submitForm(input: WeekFormInput): Promise<SubmitResult> {
  const result = validateWeekForm(input);
  if (!result.ok) return { ok: false, errors: result.errors };
  try {
    await routeSubmission(result.data);
  } catch (err) {
    console.error("submitForm: routeSubmission failed", err);
    return { ok: false, errors: GENERIC_SAVE_ERROR };
  }
  return { ok: true, church: result.data.church, monthLabel: formatMonthLabel(result.data.monthKey) };
}

/**
 * CSV confirm. Re-parses the RAW text server-side — never trusts the client's
 * already-parsed preview object, which could have been tampered with.
 */
export async function confirmCsv(rawText: string): Promise<SubmitResult> {
  const result = parseCSV(rawText);
  if (!result.ok) return { ok: false, errors: result.errors };
  try {
    await routeSubmission(result.data);
  } catch (err) {
    console.error("confirmCsv: routeSubmission failed", err);
    return { ok: false, errors: GENERIC_SAVE_ERROR };
  }
  return { ok: true, church: result.data.church, monthLabel: formatMonthLabel(result.data.monthKey) };
}

/** Powers the duplicate-month banner + "Load & edit it" prefill. */
export async function checkExisting(church: string, monthKey: string): Promise<ParsedSubmission | null> {
  if (!church || !monthKey) return null;
  return getLiveSubmission(church, monthKey);
}
