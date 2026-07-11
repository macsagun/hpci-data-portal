import { getPendingList } from "@/lib/submissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ApprovalCard from "@/components/dashboard/ApprovalCard";
import styles from "@/components/dashboard/Dashboard.module.css";

export default async function ApprovalsPage() {
  const items = await getPendingList();

  return (
    <div>
      <DashboardHeader />
      {items.length === 0 ? (
        <div className={styles.emptyCard}>
          <div className={styles.emptyIcon}>✓</div>
          <div className={styles.emptyTitle}>All caught up</div>
          <div className={styles.emptySubtitle}>There are no changes waiting for review.</div>
        </div>
      ) : (
        items.map((item) => <ApprovalCard key={item.pending.id} item={item} />)
      )}
    </div>
  );
}
