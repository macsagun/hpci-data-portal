import { dateLabel, money, num } from "@/lib/format";
import type { Week } from "@/lib/types";
import styles from "./Dashboard.module.css";

export default function WeeklyTable({ weeks, showPreacher = false }: { weeks: Week[]; showPreacher?: boolean }) {
  return (
    <div className={styles.tableScroll} style={{ border: "1px solid #eef0f3", borderRadius: "var(--radius-md)" }}>
      <table className={styles.table} style={{ fontSize: 13 }}>
        <thead>
          <tr>
            <th style={{ whiteSpace: "nowrap" }}>Sunday</th>
            <th style={{ textAlign: "right" }}>Reg</th>
            <th style={{ textAlign: "right" }}>VIP</th>
            <th style={{ textAlign: "right" }}>Tithes &amp; Offering</th>
            <th>Sermon</th>
            {showPreacher ? <th>Preacher</th> : null}
          </tr>
        </thead>
        <tbody>
          {weeks.map((w) => (
            <tr key={w.date}>
              <td style={{ whiteSpace: "nowrap", fontWeight: 600 }}>{dateLabel(w.date)}</td>
              <td style={{ textAlign: "right" }}>{num(w.regulars)}</td>
              <td style={{ textAlign: "right", color: "var(--accent)", fontWeight: 600 }}>{w.vip}</td>
              <td style={{ textAlign: "right", fontWeight: 600 }}>{money(w.giving)}</td>
              <td style={{ color: "#475467" }}>{w.sermon}</td>
              {showPreacher ? <td style={{ color: "var(--faint)", whiteSpace: "nowrap" }}>{w.preacher}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
