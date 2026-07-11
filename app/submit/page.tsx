import { getChurches } from "@/lib/submissions";
import SubmitFlow from "@/components/submit/SubmitFlow";
import styles from "@/components/submit/Submit.module.css";

export default async function SubmitPage() {
  const churches = await getChurches();

  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <span className={styles.badge}>LOCAL CHURCH SUBMISSION</span>
        <h1 className={styles.title}>Submit your monthly report</h1>
        <p className={styles.subtitle}>
          Choose your church, type in your Sunday numbers, sermons, wins and challenges, and hit submit. Every
          report is reviewed by leadership before it&apos;s saved to the dashboard.
        </p>
      </div>
      <SubmitFlow churches={churches} />
    </main>
  );
}
