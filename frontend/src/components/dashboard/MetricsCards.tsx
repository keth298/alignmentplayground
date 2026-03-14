"use client";

import type { Run } from "@/lib/types";

function StatCard({ label, value, sub, color, delta }: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  delta?: number | null;
}) {
  const deltaColor = delta != null ? (delta > 0 ? "#22c55e" : delta < 0 ? "#ef4444" : "#64748b") : undefined;
  const sign = delta != null && delta > 0 ? "+" : "";

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border-active)",
      borderRadius: 10,
      padding: "14px 18px",
      flex: 1,
      minWidth: 140,
    }}>
      <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
          {value}
        </div>
        {delta != null && (
          <div style={{ fontSize: 12, fontWeight: 600, color: deltaColor }}>
            {sign}{typeof delta === "number" ? delta.toFixed(2) : delta}
          </div>
        )}
      </div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

interface Props {
  run: Run;
  baseline?: Run | null;
}

export default function MetricsCards({ run, baseline }: Props) {
  const safe = run.avg_safety;
  const help = run.avg_helpfulness;
  const refusal = run.refusal_rate != null ? Math.round(run.refusal_rate * 100) : null;
  const falseRefusal = run.false_refusal_rate != null ? Math.round(run.false_refusal_rate * 100) : null;
  const rc = run.avg_refusal_correctness;
  const pc = run.avg_policy_consistency;
  const overall = run.overall_score;

  const bSafe = baseline?.avg_safety ?? null;
  const bHelp = baseline?.avg_helpfulness ?? null;
  const bRefusal = baseline?.refusal_rate != null ? baseline.refusal_rate * 100 : null;
  const bFalseRefusal = baseline?.false_refusal_rate != null ? baseline.false_refusal_rate * 100 : null;

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <StatCard label="Overall Score" value={overall != null ? overall.toFixed(1) : "—"} sub="weighted composite" color="var(--accent-hover)" />
      <StatCard label="Safety" value={safe != null ? safe.toFixed(1) : "—"} sub="avg 0–10" color="#6366f1" delta={safe != null && bSafe != null ? safe - bSafe : null} />
      <StatCard label="Helpfulness" value={help != null ? help.toFixed(1) : "—"} sub="avg 0–10" color="var(--green)" delta={help != null && bHelp != null ? help - bHelp : null} />
      <StatCard label="Refusal Rate" value={refusal != null ? `${refusal}%` : "—"} sub="of all prompts" color={refusal != null && refusal > 40 ? "#ef4444" : refusal != null && refusal > 20 ? "#f59e0b" : "#22c55e"} delta={refusal != null && bRefusal != null ? refusal - bRefusal : null} />
      <StatCard label="False Refusals" value={falseRefusal != null ? `${falseRefusal}%` : "—"} sub="safe prompts refused" color={falseRefusal != null && falseRefusal > 20 ? "#ef4444" : "#f59e0b"} delta={falseRefusal != null && bFalseRefusal != null ? falseRefusal - bFalseRefusal : null} />
      <StatCard label="Refusal Accuracy" value={rc != null ? rc.toFixed(1) : "—"} sub="correct refusal decisions" color="#f59e0b" />
      <StatCard label="Policy Follow" value={pc != null ? pc.toFixed(1) : "—"} sub="rule adherence" color="#8b5cf6" />
    </div>
  );
}
