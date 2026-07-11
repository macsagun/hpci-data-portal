import { getChurches, getPendingCount } from "@/lib/submissions";
import DashboardTabs from "./DashboardTabs";

export default async function DashboardHeader() {
  const [churches, pendingCount] = await Promise.all([getChurches(), getPendingCount()]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 16,
        marginBottom: 20,
      }}
    >
      <div>
        <h1 style={{ fontSize: "clamp(22px, 6vw, 30px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 4px" }}>
          Leadership Dashboard
        </h1>
        <p style={{ fontSize: "14.5px", color: "var(--muted)", margin: 0 }}>
          Monthly submissions across all {churches.length} local churches.
        </p>
      </div>
      <DashboardTabs pendingCount={pendingCount} />
    </div>
  );
}
