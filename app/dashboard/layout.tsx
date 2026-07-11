import { isAuthenticated } from "@/lib/auth";
import PassphraseGate from "@/components/dashboard/PassphraseGate";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const unlocked = await isAuthenticated();

  if (!unlocked) {
    return <PassphraseGate />;
  }

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "34px clamp(14px, 4vw, 28px) 80px", width: "100%" }}>
      {children}
    </main>
  );
}
