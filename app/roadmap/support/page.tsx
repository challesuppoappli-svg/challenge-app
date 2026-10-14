import Link from "next/link";

export default function RoadmapSupportPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px 24px 120px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontSize: "12px",
          fontWeight: 600,
          letterSpacing: "2px",
          color: "#888",
          marginBottom: "12px",
        }}
      >
        AI SUPPORT
      </p>

      <h1
        style={{
          fontSize: "32px",
          fontWeight: 700,
          marginBottom: "16px",
        }}
      >
        AIサポート
      </h1>

      <p
        style={{
          color: "#666",
          lineHeight: "1.8",
          marginBottom: "40px",
        }}
      >
        あなた専用のロードマップを
        <br />
        作成します
      </p>

      <Link
        href="/roadmap/support/goals"
        style={{
          display: "inline-block",
          padding: "12px 24px",
          backgroundColor: "#000",
          color: "#fff",
          borderRadius: "8px",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        開始する
      </Link>
    </main>
  );
}
