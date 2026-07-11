import styles from "./Dashboard.module.css";

export default function StatusBadges({ submitted, hasPending }: { submitted: boolean; hasPending: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {submitted ? (
        <span className={`${styles.badge} ${styles.badgeSubmitted}`}>● Submitted</span>
      ) : (
        <span className={`${styles.badge} ${styles.badgeAwaiting}`}>● Awaiting</span>
      )}
      {hasPending ? <span className={`${styles.badge} ${styles.badgePending}`}>↻ Pending review</span> : null}
    </div>
  );
}
