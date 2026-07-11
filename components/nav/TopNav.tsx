"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { lockAction } from "@/app/dashboard/login/actions";
import styles from "./TopNav.module.css";

export default function TopNav({ unlocked }: { unlocked: boolean }) {
  const pathname = usePathname();
  const isDash = pathname.startsWith("/dashboard");
  const isSubmit = !isDash;

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Image src="/logo.svg" alt="His Presence Church" width={38} height={38} className={styles.logo} />
        <div className={styles.brand}>
          <span className={styles.brandName}>
            <span className={styles.fullLabel}>His Presence Church</span>
            <span className={styles.shortLabel}>HPCI</span>
          </span>
          <span className={styles.brandSub}>Data Portal</span>
        </div>
        <div className={styles.spacer} />
        <nav className={styles.nav}>
          <div className={styles.pillGroup}>
            <Link
              href="/submit"
              className={`${styles.pillLink} ${isSubmit ? styles.pillLinkActive : ""}`}
            >
              <span className={styles.fullLabel}>Submit Report</span>
              <span className={styles.shortLabel}>Submit</span>
            </Link>
            <Link
              href="/dashboard"
              className={`${styles.pillLink} ${isDash ? styles.pillLinkActive : ""}`}
            >
              <span className={styles.fullLabel}>🔒 Dashboard</span>
              <span className={styles.shortLabel}>🔒</span>
            </Link>
          </div>
          {isDash && unlocked ? (
            <form action={lockAction}>
              <button type="submit" className={styles.lockBtn}>
                Lock
              </button>
            </form>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
