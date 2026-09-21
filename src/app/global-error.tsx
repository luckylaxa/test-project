"use client";

/**
 * Last-resort boundary: catches failures in the root layout itself, so it has
 * to render its own <html> and cannot rely on the site's fonts or styles.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.25rem",
          background: "#fbf9f5",
          color: "#0b0b0b",
          fontFamily: "Georgia, serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <h1 style={{ fontWeight: 300, fontSize: "2rem", margin: 0 }}>
          Something interrupted this page.
        </h1>
        <button
          type="button"
          onClick={reset}
          style={{
            border: "1px solid rgba(11,11,11,.25)",
            background: "transparent",
            padding: "0.9rem 2rem",
            fontSize: "0.6875rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
