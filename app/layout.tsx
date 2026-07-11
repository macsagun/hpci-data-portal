import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import TopNav from "@/components/nav/TopNav";
import { isAuthenticated } from "@/lib/auth";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "His Presence Church — Data Portal",
  description: "Local church monthly reporting for His Presence Church International.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const unlocked = await isAuthenticated();

  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", flex: 1 }}>
          <TopNav unlocked={unlocked} />
          {children}
          <footer
            style={{
              marginTop: "auto",
              borderTop: "1px solid var(--border)",
              padding: "18px 28px",
              textAlign: "center",
              fontSize: 12,
              color: "var(--faint)",
            }}
          >
            His Presence Church International · Local Church Data Portal
          </footer>
        </div>
      </body>
    </html>
  );
}
