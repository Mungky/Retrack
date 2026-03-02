"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            fontFamily: "system-ui, sans-serif",
            backgroundColor: "#09090b",
            color: "#fafafa",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
            Oops! Sesuatu berjalan tidak semestinya.
          </h1>
          <p style={{ color: "#a1a1aa", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
            Jangan khawatir, data Anda aman. Silakan coba muat ulang halaman.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.75rem",
                backgroundColor: "#7c3aed",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Coba Lagi
            </button>
            <a
              href="/dashboard"
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.75rem",
                border: "1px solid #3f3f46",
                color: "#fafafa",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Kembali ke Dashboard
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
