import { getAuditLog } from "@/lib/submissions";
import { monthLabel } from "@/lib/format";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import styles from "@/components/dashboard/Dashboard.module.css";

function formatTimestamp(d: Date): string {
  return d.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AuditLogPage() {
  const entries = await getAuditLog();

  return (
    <div>
      <DashboardHeader />
      {entries.length === 0 ? (
        <div className={styles.emptyCard}>
          <div className={styles.emptyIcon}>✓</div>
          <div className={styles.emptyTitle}>No activity yet</div>
          <div className={styles.emptySubtitle}>Approve or reject a submission and it will show up here.</div>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Local Church</th>
                  <th>Month</th>
                  <th>Action</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 700 }}>{e.church}</td>
                    <td style={{ color: "var(--muted)" }}>{monthLabel(e.monthKey)}</td>
                    <td>
                      <span className={`${styles.badge} ${e.action === "approve" ? styles.badgeSubmitted : styles.badgeReject}`}>
                        {e.action === "approve" ? "✓ Approved" : "✕ Rejected"}
                      </span>
                    </td>
                    <td style={{ color: "var(--muted)" }}>{formatTimestamp(e.actedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
