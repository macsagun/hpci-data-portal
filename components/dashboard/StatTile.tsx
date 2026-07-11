import styles from "./Dashboard.module.css";

export default function StatTile({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub: string;
  color?: string;
}) {
  return (
    <div className={styles.card}>
      <div className={styles.kpiLabel}>{label}</div>
      <div className={styles.kpiValue} style={color ? { color } : undefined}>
        {value}
      </div>
      <div className={styles.kpiSub}>{sub}</div>
    </div>
  );
}
