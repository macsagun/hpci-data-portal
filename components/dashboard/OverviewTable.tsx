import Link from "next/link";
import { stats } from "@/lib/stats";
import { money, num } from "@/lib/format";
import type { OverviewRow } from "@/lib/submissions";
import StatusBadges from "./StatusBadge";
import styles from "./Dashboard.module.css";

export default function OverviewTable({ rows }: { rows: OverviewRow[] }) {
  return (
    <div className={styles.tableCard}>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Local Church</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Avg Sunday Att</th>
              <th style={{ textAlign: "right" }}>Regulars</th>
              <th style={{ textAlign: "right" }}>VIP</th>
              <th style={{ textAlign: "right" }}>Giving</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const s = r.submission ? stats(r.submission.weeks) : null;
              return (
                <tr key={r.church}>
                  <td style={{ fontWeight: 700, padding: 0 }}>
                    <Link
                      href={`/dashboard/church/${encodeURIComponent(r.church)}`}
                      style={{ display: "block", padding: "14px 20px", color: "inherit" }}
                    >
                      {r.church}
                    </Link>
                  </td>
                  <td>
                    <StatusBadges submitted={!!r.submission} hasPending={r.hasPending} />
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{s ? num(s.avgAtt) : "—"}</td>
                  <td style={{ textAlign: "right", color: "var(--muted)" }}>{s ? num(s.avgReg) : "—"}</td>
                  <td style={{ textAlign: "right", color: "var(--accent)", fontWeight: 600 }}>
                    {s ? num(s.totalVip) : "—"}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{s ? money(s.giving) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
