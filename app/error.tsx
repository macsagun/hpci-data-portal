"use client";

import { useEffect } from "react";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "90px 28px 80px", width: "100%", textAlign: "center" }}>
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: "var(--danger-tint)",
          color: "var(--danger)",
          fontSize: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 18px",
        }}
      >
        !
      </div>
      <div style={{ fontWeight: 800, fontSize: 19, marginBottom: 6 }}>Something went wrong</div>
      <div style={{ fontSize: "13.5px", color: "var(--muted)", marginBottom: 22, lineHeight: 1.5 }}>
        Sorry about that — please try again. If it keeps happening, let your admin know.
      </div>
      <button
        type="button"
        onClick={() => reset()}
        style={{
          background: "var(--accent)",
          color: "#fff",
          border: "none",
          padding: "12px 20px",
          borderRadius: 10,
          fontWeight: 700,
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </main>
  );
}
