import { getMonthKeysWithData, getOverviewData, getChurches } from "@/lib/submissions";
import { stats } from "@/lib/stats";
import { money, num } from "@/lib/format";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MonthPills from "@/components/dashboard/MonthPills";
import StatTile from "@/components/dashboard/StatTile";
import OverviewTable from "@/components/dashboard/OverviewTable";
import styles from "@/components/dashboard/Dashboard.module.css";

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const [monthKeys, churches] = await Promise.all([getMonthKeysWithData(), getChurches()]);

  if (monthKeys.length === 0) {
    return (
      <div>
        <DashboardHeader />
        <div className={styles.emptyCard}>
          <div className={styles.emptyIcon}>✓</div>
          <div className={styles.emptyTitle}>No reports yet</div>
          <div className={styles.emptySubtitle}>Once a local church submits a report and it&apos;s approved, it will show up here.</div>
        </div>
      </div>
    );
  }

  const selMonth = month && monthKeys.includes(month) ? month : monthKeys[monthKeys.length - 1];
  const rows = await getOverviewData(selMonth);

  let kpiAtt = 0;
  let kpiVip = 0;
  let kpiGiving = 0;
  let kpiSubmitted = 0;
  rows.forEach((r) => {
    if (!r.submission) return;
    kpiSubmitted++;
    const s = stats(r.submission.weeks);
    kpiAtt += s.avgAtt;
    kpiVip += s.totalVip;
    kpiGiving += s.giving;
  });

  return (
    <div>
      <DashboardHeader />
      <MonthPills monthKeys={monthKeys} selected={selMonth} />
      <div className={styles.kpiGrid}>
        <StatTile label="Reports In" value={kpiSubmitted} sub={`of ${churches.length} churches`} />
        <StatTile label="Network Sunday Attendance" value={num(kpiAtt)} sub="avg. per Sunday, all churches" />
        <StatTile label="First Timers (VIP)" value={num(kpiVip)} sub="welcomed this month" color="var(--accent)" />
        <StatTile label="Total Giving" value={money(kpiGiving)} sub="tithes + offering" color="var(--positive-ink)" />
      </div>
      <OverviewTable rows={rows} />
    </div>
  );
}
