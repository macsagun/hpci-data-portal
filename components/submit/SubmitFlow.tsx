"use client";

import { useState } from "react";
import Link from "next/link";
import GuidedForm from "./GuidedForm";
import CsvUpload from "./CsvUpload";
import styles from "./Submit.module.css";

type SuccessInfo = { church: string; monthLabel: string };

export default function SubmitFlow({ churches }: { churches: string[] }) {
  const [mode, setMode] = useState<"form" | "csv">("form");
  const [success, setSuccess] = useState<SuccessInfo | null>(null);

  if (success) {
    return (
      <div className={styles.successCard}>
        <div className={styles.successIcon}>✓</div>
        <div className={styles.successTitle}>Sent for approval</div>
        <div className={styles.successBody}>
          Thank you! <strong>{success.church}</strong>&apos;s report for <strong>{success.monthLabel}</strong> has
          been sent to leadership for review. It will be saved to the dashboard once a pastor approves it.
        </div>
        <div className={styles.successActions}>
          <Link href="/dashboard" className={styles.btnPrimary}>
            View in dashboard →
          </Link>
          <button type="button" onClick={() => setSuccess(null)} className={styles.btnSecondary}>
            Submit another
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.modeToggle}>
        <button
          type="button"
          onClick={() => setMode("form")}
          className={`${styles.modeBtn} ${mode === "form" ? styles.modeBtnActive : ""}`}
        >
          ✍️ Enter details
        </button>
        <button
          type="button"
          onClick={() => setMode("csv")}
          className={`${styles.modeBtn} ${mode === "csv" ? styles.modeBtnActive : ""}`}
        >
          Upload a CSV instead
        </button>
      </div>

      {mode === "csv" ? (
        <CsvUpload onSubmitted={setSuccess} />
      ) : (
        <GuidedForm churches={churches} onSubmitted={setSuccess} />
      )}
    </>
  );
}
