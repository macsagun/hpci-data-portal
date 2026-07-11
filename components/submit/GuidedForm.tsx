"use client";

import { useEffect, useState, useTransition } from "react";
import { MONTH_NAMES, monthKeyOf, isFutureMonth, sundays } from "@/lib/dates";
import { monthLabel as formatMonthLabel } from "@/lib/format";
import { submitForm, checkExisting } from "@/app/submit/actions";
import type { WeekFieldInput, WeekFormInput } from "@/lib/validation";
import type { ParsedSubmission } from "@/lib/types";
import WeekRow from "./WeekRow";
import submitStyles from "./Submit.module.css";
import styles from "./GuidedForm.module.css";

const YEAR_OPTIONS = ["2025", "2026", "2027"];

export default function GuidedForm({
  churches,
  onSubmitted,
}: {
  churches: string[];
  onSubmitted: (result: { church: string; monthLabel: string }) => void;
}) {
  const [church, setChurch] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [values, setValues] = useState<Record<string, WeekFieldInput>>({});
  const [wins, setWins] = useState("");
  const [challenges, setChallenges] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [existing, setExisting] = useState<ParsedSubmission | null>(null);
  const [isPending, startTransition] = useTransition();

  const formReady = !!(church && month && year);
  const monthKey = formReady ? monthKeyOf(Number(year), Number(month)) : "";
  const formWeeks = formReady ? sundays(Number(year), Number(month)) : [];
  const futureMonth = formReady && isFutureMonth(Number(year), Number(month));
  const dupExists = formReady && !!existing;

  useEffect(() => {
    if (!formReady) return;
    let cancelled = false;
    checkExisting(church, monthKey).then((sub) => {
      if (!cancelled) setExisting(sub);
    });
    return () => {
      cancelled = true;
    };
  }, [church, monthKey, formReady]);

  function updField(date: string, field: keyof WeekFieldInput, val: string) {
    setValues((prev) => ({ ...prev, [date]: { ...prev[date], [field]: val } }));
    setErrors([]);
  }

  function loadExisting() {
    if (!existing) return;
    const next: Record<string, WeekFieldInput> = {};
    existing.weeks.forEach((w) => {
      next[w.date] = {
        regulars: String(w.regulars),
        vip: String(w.vip),
        giving: String(w.giving),
        sermon: w.sermon,
        preacher: w.preacher === "—" ? "" : w.preacher,
      };
    });
    setValues(next);
    setWins(existing.wins);
    setChallenges(existing.challenges);
    setErrors([]);
  }

  function handleSubmit() {
    const input: WeekFormInput = { church, year, month, values, wins, challenges };
    startTransition(async () => {
      const result = await submitForm(input);
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      onSubmitted(result);
    });
  }

  return (
    <div className={styles.card}>
      <div className={styles.selectRow}>
        <label className={styles.field}>
          Local Church
          <select value={church} onChange={(e) => setChurch(e.target.value)} className={styles.select}>
            <option value="">Select your church…</option>
            {churches.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Month
          <select value={month} onChange={(e) => setMonth(e.target.value)} className={styles.select}>
            <option value="">Select month…</option>
            {MONTH_NAMES.map((m, i) => (
              <option key={m} value={String(i + 1)}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Year
          <select value={year} onChange={(e) => setYear(e.target.value)} className={styles.select}>
            <option value="">Year…</option>
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!formReady ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>↑</div>
          <div className={styles.emptyTitle}>Choose your church, month and year to begin</div>
          <div className={styles.emptySubtitle}>We&apos;ll then list every Sunday for you to fill in.</div>
        </div>
      ) : (
        <>
          {dupExists || futureMonth ? (
            <div className={styles.noticeArea}>
              {dupExists ? (
                <div className={styles.dupBanner}>
                  <span style={{ fontSize: 18 }}>⚠️</span>
                  <div className={styles.dupBannerText}>
                    <div className={styles.dupBannerTitle}>
                      A report for {formatMonthLabel(monthKey)} is already on file
                    </div>
                    <div className={styles.dupBannerBody}>
                      {church} already submitted this month. Submitting again will send your changes for leadership
                      approval.
                    </div>
                  </div>
                  <button type="button" onClick={loadExisting} className={styles.dupBannerBtn}>
                    Load &amp; edit it
                  </button>
                </div>
              ) : null}
              {futureMonth ? (
                <div className={styles.futureNotice}>
                  <strong>Heads up:</strong> this month hasn&apos;t ended yet. Enter only the Sundays that have
                  already happened and leave the rest blank.
                </div>
              ) : null}
            </div>
          ) : null}

          <div className={styles.body}>
            <div className={styles.bodyTitle}>Sunday-by-Sunday</div>
            <div className={styles.bodySubtitle}>
              We&apos;ve listed every Sunday in {formatMonthLabel(monthKey)} — just type each week&apos;s numbers.
              Leave a Sunday blank if there was no service.
            </div>
            {formWeeks.map((d) => (
              <WeekRow key={d} date={d} value={values[d] || {}} onChange={updField} />
            ))}

            <div className={styles.longFieldsGrid}>
              <label className={styles.winsField}>
                Wins this month
                <textarea
                  value={wins}
                  onChange={(e) => {
                    setWins(e.target.value);
                    setErrors([]);
                  }}
                  rows={4}
                  placeholder="What did God do this month?"
                  className={styles.winsTextarea}
                />
              </label>
              <label className={styles.challengesField}>
                Challenges this month
                <textarea
                  value={challenges}
                  onChange={(e) => {
                    setChallenges(e.target.value);
                    setErrors([]);
                  }}
                  rows={4}
                  placeholder="What do you need prayer or help with?"
                  className={styles.challengesTextarea}
                />
              </label>
            </div>

            {errors.length > 0 ? (
              <div className={submitStyles.errorBox} style={{ marginTop: 16 }}>
                <div className={submitStyles.errorTitle}>Please fix the following:</div>
                <ul className={submitStyles.errorList}>
                  {errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <div className={styles.footer}>
            <button type="button" onClick={handleSubmit} disabled={isPending} className={styles.submitBtn}>
              {isPending ? "Submitting…" : dupExists ? "Submit changes for approval →" : "Submit to leadership →"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
