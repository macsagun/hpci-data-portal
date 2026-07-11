"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./DashboardTabs.module.css";

export default function DashboardTabs({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname();

  const tabs = [
    { href: "/dashboard/overview", label: "Overview" },
    { href: "/dashboard/trends", label: "Trends" },
    { href: "/dashboard/approvals", label: "Approvals" },
    { href: "/dashboard/audit", label: "Audit Log" },
  ];

  return (
    <div className={styles.pillGroup}>
      {tabs.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} className={`${styles.pillLink} ${active ? styles.pillLinkActive : ""}`}>
            {t.label}
            {t.href === "/dashboard/approvals" && pendingCount > 0 ? (
              <span className={styles.badge}>{pendingCount}</span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
