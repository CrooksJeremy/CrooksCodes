import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "JeremyCrooks.ca — Full-Stack Developer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a08",
          color: "#f0ede4",
          padding: "72px 80px",
          fontFamily: "Georgia, 'Times New Roman', serif",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 20,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#6a6860",
            fontFamily: "'Courier New', monospace",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: "#c8a84b",
              }}
            />
            <span>Portfolio — 2026</span>
          </span>
          <span style={{ color: "#f0ede4" }}>JeremyCrooks<span style={{ color: "#c8a84b" }}>.</span>ca</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              fontSize: 28,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#6a6860",
              fontFamily: "'Courier New', monospace",
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <span
              style={{
                width: 56,
                height: 2,
                background: "#c8a84b",
              }}
            />
            <span>Full-Stack Developer</span>
          </div>

          <div
            style={{
              fontSize: 156,
              fontWeight: 700,
              lineHeight: 0.92,
              letterSpacing: "-0.01em",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Building</span>
            <span style={{ color: "#c8a84b" }}>Scalable</span>
            <span>Systems.</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 20,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#6a6860",
            fontFamily: "'Courier New', monospace",
            borderTop: "1px solid rgba(240, 237, 228, 0.12)",
            paddingTop: 28,
          }}
        >
          <span>Halifax, Nova Scotia</span>
          <span style={{ color: "#f0ede4" }}>Next.js · React · Node.js · PostgreSQL</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
