"use client";

import { formDateLabel } from "@/lib/format";
import type { WeekFieldInput } from "@/lib/validation";
import styles from "./GuidedForm.module.css";

export default function WeekRow({
  date,
  value,
  onChange,
}: {
  date: string;
  value: WeekFieldInput;
  onChange: (date: string, field: keyof WeekFieldInput, val: string) => void;
}) {
  return (
    <div className={styles.week}>
      <div className={styles.weekLabel}>
        <span className={styles.weekDot} />
        {formDateLabel(date)}
      </div>
      <div className={styles.weekGrid3}>
        <label className={styles.weekField}>
          Regulars
          <input
            type="number"
            min={0}
            value={value.regulars ?? ""}
            onChange={(e) => onChange(date, "regulars", e.target.value)}
            placeholder="0"
            className={styles.weekInput}
          />
        </label>
        <label className={styles.weekField}>
          First Timers (VIP)
          <input
            type="number"
            min={0}
            value={value.vip ?? ""}
            onChange={(e) => onChange(date, "vip", e.target.value)}
            placeholder="0"
            className={styles.weekInput}
          />
        </label>
        <label className={styles.weekField}>
          Tithes &amp; Offering (₱)
          <input
            type="number"
            min={0}
            value={value.giving ?? ""}
            onChange={(e) => onChange(date, "giving", e.target.value)}
            placeholder="0"
            className={styles.weekInput}
          />
        </label>
      </div>
      <div className={styles.weekGrid2}>
        <label className={styles.weekField}>
          Sermon Title
          <input
            type="text"
            value={value.sermon ?? ""}
            onChange={(e) => onChange(date, "sermon", e.target.value)}
            placeholder="e.g. Rooted and Established"
            className={styles.weekInput}
          />
        </label>
        <label className={styles.weekField}>
          Preacher
          <input
            type="text"
            value={value.preacher ?? ""}
            onChange={(e) => onChange(date, "preacher", e.target.value)}
            placeholder="e.g. Ptr. Grace Lim"
            className={styles.weekInput}
          />
        </label>
      </div>
    </div>
  );
}
