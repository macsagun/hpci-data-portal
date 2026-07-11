import { getTrendsData } from "@/lib/submissions";
import { stats } from "@/lib/stats";
import { monthShort, monthLabel, num } from "@/lib/format";
import { moneyK } from "@/lib/format";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import LineChart from "@/components/charts/LineChart";
import styles from "@/components/dashboard/Dashboard.module.css";

export default async function TrendsPage() {
  const { monthKeys, churches, submissionsByChurchAndMonth } = await getTrendsData();

  if (monthKeys.length === 0) {
    return (
      <div>
        <DashboardHeader />
        <div className={styles.emptyCard}>
          <div className={styles.emptyIcon}>✓</div>
          <div className={styles.emptyTitle}>No reports yet</div>
          <div className={styles.emptySubtitle}>Trends will appear once at least one month has approved reports.</div>
        </div>
      </div>
    );
  }

  const attSeries = monthKeys.map((k) => {
    let sum = 0;
    churches.forEach((ch) => {
      const sub = submissionsByChurchAndMonth.get(`${ch}|${k}`);
      if (sub) sum += stats(sub.weeks).avgAtt;
    });
    return { label: monthShort(k), value: sum };
  });

  const giveSeries = monthKeys.map((k) => {
    let sum = 0;
    churches.forEach((ch) => {
      const sub = submissionsByChurchAndMonth.get(`${ch}|${k}`);
      if (sub) sum += stats(sub.weeks).giving;
    });
    return { label: monthShort(k), value: sum };
  });

  return (
    <div>
      <DashboardHeader />
      <div className={styles.chartsGrid2}>
        <div className={styles.card}>
          <div className={styles.chartCardTitle}>Network Sunday Attendance</div>
          <div className={styles.chartCardSubtitle}>Total average Sunday attendance across all reporting churches</div>
          <LineChart series={attSeries} color="#2f6ae0" width={500} height={220} />
        </div>
        <div className={styles.card}>
          <div className={styles.chartCardTitle}>Total Giving</div>
          <div className={styles.chartCardSubtitle}>Combined tithes + offering across all reporting churches</div>
          <LineChart series={giveSeries} color="#12946a" width={500} height={220} yFmt={moneyK} />
        </div>
      </div>
      <div className={styles.card}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Attendance by church &amp; month</div>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr style={{ background: "none" }}>
                <th>Local Church</th>
                {monthKeys.map((k) => (
                  <th key={k} style={{ textAlign: "right" }} title={monthLabel(k)}>
                    {monthShort(k)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {churches.map((ch) => (
                <tr key={ch}>
                  <td style={{ fontWeight: 600 }}>{ch}</td>
                  {monthKeys.map((k) => {
                    const sub = submissionsByChurchAndMonth.get(`${ch}|${k}`);
                    return (
                      <td key={k} style={{ textAlign: "right", color: "var(--muted)" }}>
                        {sub ? num(stats(sub.weeks).avgAtt) : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
