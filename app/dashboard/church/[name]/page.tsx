import Link from "next/link";
import { notFound } from "next/navigation";
import { getChurchHistory, getChurches } from "@/lib/submissions";
import { stats } from "@/lib/stats";
import { money, monthShort, monthLabel, num } from "@/lib/format";
import LineChart from "@/components/charts/LineChart";
import WeeklyTable from "@/components/dashboard/WeeklyTable";
import dashStyles from "@/components/dashboard/Dashboard.module.css";
import styles from "@/components/dashboard/ChurchDetail.module.css";

export default async function ChurchDetailPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const church = decodeURIComponent(name);

  const churches = await getChurches();
  if (!churches.includes(church)) notFound();

  const history = await getChurchHistory(church);

  const attSeries = history.map((sub) => ({ label: monthShort(sub.monthKey), value: stats(sub.weeks).avgAtt }));
  const giveSeries = history.map((sub) => ({ label: monthShort(sub.monthKey), value: stats(sub.weeks).giving }));

  const newestFirst = [...history].reverse();

  return (
    <div className={styles.wrap}>
      <Link href="/dashboard/overview" className={styles.backLink}>
        ← Back to all churches
      </Link>
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Local Church</div>
          <h1 className={styles.churchTitle}>{church}</h1>
        </div>
        <div className={styles.reportCount}>
          {history.length} monthly report{history.length === 1 ? "" : "s"} on file
        </div>
      </div>

      {history.length === 0 ? (
        <div className={dashStyles.emptyCard}>
          <div className={dashStyles.emptyIcon}>✓</div>
          <div className={dashStyles.emptyTitle}>No approved reports yet</div>
          <div className={dashStyles.emptySubtitle}>Once a report for this church is approved, it will show up here.</div>
        </div>
      ) : (
        <>
          <div className={dashStyles.chartsGrid2}>
            <div className={dashStyles.card}>
              <div className={dashStyles.chartCardTitle}>Average Sunday Attendance</div>
              <div className={dashStyles.chartCardSubtitle}>Regulars + first timers, per month</div>
              <LineChart series={attSeries} color="#2f6ae0" width={520} height={200} />
            </div>
            <div className={dashStyles.card}>
              <div className={dashStyles.chartCardTitle}>Total Giving</div>
              <div className={dashStyles.chartCardSubtitle}>Combined tithes &amp; offering, per month</div>
              <LineChart
                series={giveSeries}
                color="#12946a"
                width={520}
                height={200}
                yFmt={(v) => "₱" + (v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + "M" : Math.round(v / 1000) + "k")}
              />
            </div>
          </div>

          {newestFirst.map((sub) => {
            const s = stats(sub.weeks);
            return (
              <div key={sub.monthKey} className={styles.monthCard}>
                <div className={styles.monthCardHeader}>
                  <div className={styles.monthCardTitle}>{monthLabel(sub.monthKey)}</div>
                  <div className={styles.chips}>
                    <span className={`${styles.chip} ${styles.chipAtt}`}>{num(s.avgAtt)} avg att</span>
                    <span className={`${styles.chip} ${styles.chipVip}`}>{num(s.totalVip)} VIP</span>
                    <span className={`${styles.chip} ${styles.chipGiving}`}>{money(s.giving)}</span>
                  </div>
                </div>
                <div className={styles.monthCardBody}>
                  <WeeklyTable weeks={sub.weeks} showPreacher />
                  <div className={styles.notesGrid}>
                    <div className={styles.winsCard}>
                      <div className={styles.noteLabel} style={{ color: "var(--positive-ink)" }}>
                        WINS
                      </div>
                      <div className={styles.noteBody} style={{ color: "#155e45" }}>
                        {sub.wins}
                      </div>
                    </div>
                    <div className={styles.challengesCard}>
                      <div className={styles.noteLabel} style={{ color: "var(--warning)" }}>
                        CHALLENGES
                      </div>
                      <div className={styles.noteBody} style={{ color: "#7c4a12" }}>
                        {sub.challenges}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
