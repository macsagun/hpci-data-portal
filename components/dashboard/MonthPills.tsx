import Link from "next/link";
import { monthShort } from "@/lib/format";
import styles from "./Dashboard.module.css";

export default function MonthPills({ monthKeys, selected }: { monthKeys: string[]; selected: string }) {
  return (
    <div className={styles.pillRow}>
      {monthKeys.map((k) => (
        <Link
          key={k}
          href={`/dashboard/overview?month=${k}`}
          className={`${styles.pill} ${k === selected ? styles.pillActive : ""}`}
        >
          {monthShort(k)} {k.slice(0, 4)}
        </Link>
      ))}
    </div>
  );
}
