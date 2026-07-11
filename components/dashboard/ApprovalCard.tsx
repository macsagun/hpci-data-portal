import { stats, deltaNum, deltaMoney } from "@/lib/stats";
import { num, money, monthLabel } from "@/lib/format";
import type { PendingListItem } from "@/lib/submissions";
import { approvePendingAction, rejectPendingAction } from "@/app/dashboard/approvals/actions";
import WeeklyTable from "./WeeklyTable";
import styles from "./ApprovalCard.module.css";

function timeAgo(date: Date): string {
  const ms = Date.now() - date.getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `Submitted ${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Submitted ${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `Submitted ${days} day${days === 1 ? "" : "s"} ago`;
}

export default function ApprovalCard({ item }: { item: PendingListItem }) {
  const { pending, live } = item;
  const ns = stats(pending.weeks);
  const os = live ? stats(live.weeks) : null;

  const dAtt = deltaNum(os ? os.avgAtt : null, ns.avgAtt);
  const dVip = deltaNum(os ? os.totalVip : null, ns.totalVip);
  const dGiving = deltaMoney(os ? os.giving : null, ns.giving);

  const winsChanged = live ? live.wins !== pending.wins : true;
  const challengesChanged = live ? live.challenges !== pending.challenges : true;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <div className={styles.headerTop}>
            <span className={styles.churchName}>{pending.church}</span>
            <span className={styles.badge}>{live ? "↻ Change requested" : "✦ New report"}</span>
          </div>
          <div className={styles.meta}>
            {monthLabel(pending.monthKey)} · {timeAgo(pending.submittedAt)}
          </div>
        </div>
        <div className={styles.actions}>
          <form action={rejectPendingAction.bind(null, pending.id)}>
            <button type="submit" className={styles.rejectBtn}>
              Reject
            </button>
          </form>
          <form action={approvePendingAction.bind(null, pending.id)}>
            <button type="submit" className={styles.approveBtn}>
              {live ? "Approve & update" : "Approve & save"}
            </button>
          </form>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.sectionLabel}>{live ? "WHAT CHANGED" : "SUBMITTED DATA"}</div>
        <div className={styles.tiles}>
          <div className={styles.tile}>
            <div className={styles.tileLabel}>Avg Sunday Att</div>
            <div className={styles.tileValueRow}>
              <span className={styles.tileValue}>{num(ns.avgAtt)}</span>
              <span className={styles.tileDelta} style={{ color: dAtt.color }}>
                {dAtt.str}
              </span>
            </div>
            {os ? <div className={styles.tileWas}>was {num(os.avgAtt)}</div> : null}
          </div>
          <div className={styles.tile}>
            <div className={styles.tileLabel}>First Timers (VIP)</div>
            <div className={styles.tileValueRow}>
              <span className={styles.tileValue}>{num(ns.totalVip)}</span>
              <span className={styles.tileDelta} style={{ color: dVip.color }}>
                {dVip.str}
              </span>
            </div>
            {os ? <div className={styles.tileWas}>was {num(os.totalVip)}</div> : null}
          </div>
          <div className={styles.tile}>
            <div className={styles.tileLabel}>Total Giving</div>
            <div className={styles.tileValueRow}>
              <span className={styles.tileValue} style={{ fontSize: 20 }}>
                {money(ns.giving)}
              </span>
              <span className={styles.tileDelta} style={{ color: dGiving.color }}>
                {dGiving.str}
              </span>
            </div>
            {os ? <div className={styles.tileWas}>was {money(os.giving)}</div> : null}
          </div>
        </div>

        <div className={styles.tableWrap}>
          <WeeklyTable weeks={pending.weeks} />
        </div>

        <div className={styles.notesGrid}>
          <div className={styles.winsCard}>
            <div className={styles.noteLabel} style={{ color: "var(--positive-ink)" }}>
              WINS
            </div>
            <div className={styles.noteBody} style={{ color: "#155e45" }}>
              {pending.wins}
            </div>
            {winsChanged && live ? (
              <div className={`${styles.notePrev} ${styles.notePrevWins}`}>Previously: {live.wins}</div>
            ) : null}
          </div>
          <div className={styles.challengesCard}>
            <div className={styles.noteLabel} style={{ color: "var(--warning)" }}>
              CHALLENGES
            </div>
            <div className={styles.noteBody} style={{ color: "#7c4a12" }}>
              {pending.challenges}
            </div>
            {challengesChanged && live ? (
              <div className={`${styles.notePrev} ${styles.notePrevChallenges}`}>Previously: {live.challenges}</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
