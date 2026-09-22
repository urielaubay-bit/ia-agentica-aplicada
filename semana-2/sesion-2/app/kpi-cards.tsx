export function KpiCards({ kpis, caption }: { kpis: { label: string; value: string; delta?: string }[]; caption?: string }) {
  return (
    <div style={{ margin: "8px 0" }}>
      {caption && <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>{caption}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {kpis.map((k) => (
          <div key={k.label} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 12, color: "#666" }}>{k.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{k.value}</div>
            {k.delta && <div style={{ fontSize: 12, color: "#1f9d6b" }}>{k.delta}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
