"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#f5f3f0",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: 480 }}>
            <div style={{ fontSize: 72, marginBottom: 24 }}>🌊</div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: "#111",
                margin: "0 0 8px",
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                color: "#888",
                fontSize: 15,
                margin: "0 0 32px",
                lineHeight: 1.6,
              }}
            >
              An unexpected error occurred. Our team has been notified.
              {error.digest && (
                <span
                  style={{
                    display: "block",
                    fontFamily: "monospace",
                    fontSize: 12,
                    color: "#ccc",
                    marginTop: 8,
                  }}
                >
                  Error ID: {error.digest}
                </span>
              )}
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={reset}
                style={{
                  padding: "10px 24px",
                  borderRadius: 12,
                  border: "none",
                  background: "linear-gradient(135deg, #185FA5, #0C447C)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Try Again
              </button>
              <a
                href="/"
                style={{
                  padding: "10px 24px",
                  borderRadius: 12,
                  background: "#f0ede8",
                  color: "#555",
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: "none",
                }}
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
