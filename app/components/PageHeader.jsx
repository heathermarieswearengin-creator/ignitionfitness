"use client";

// Shared page header component with explicit inline styles
// Used on interior pages (Our Story, The Studio, etc.)
// Left-aligned design with badge, title, and subtitle sharing the same left edge
export function PageHeader({ badge, title, subtitle }) {
  return (
    <header
      style={{
        position: "relative",
        padding: "90px 0 50px",
        overflow: "hidden",
      }}
    >
      {/* Radial glow behind header */}
      <div
        style={{
          position: "absolute",
          top: -80,
          left: 0,
          width: 600,
          height: 400,
          background: "radial-gradient(ellipse, rgba(224,45,36,.15), transparent 60%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />
      <div className="wrap" style={{ position: "relative", zIndex: 2 }}>
        {/* Badge/eyebrow */}
        <div
          style={{
            marginBottom: 20,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "'Spline Sans Mono', monospace",
            fontSize: 11,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: "#a39080",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#e02d24",
            }}
          />
          {badge}
        </div>

        {/* Main title - using Anton display font */}
        <h1
          style={{
            fontFamily: "'Anton', sans-serif",
            fontSize: "clamp(48px, 10vw, 72px)",
            fontWeight: 400, // Anton is already bold, weight 400 is its only weight
            lineHeight: 0.92,
            textTransform: "uppercase",
            letterSpacing: ".01em",
            color: "#f3ece1",
            margin: "0 0 18px",
          }}
        >
          {title}
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: "'Archivo', sans-serif",
            color: "#a39080",
            fontSize: 18,
            lineHeight: 1.5,
            margin: 0,
            maxWidth: 520,
          }}
        >
          {subtitle}
        </p>
      </div>
    </header>
  );
}
