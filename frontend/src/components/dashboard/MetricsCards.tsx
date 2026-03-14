"use client";

import type { Run } from "@/lib/types";

function StatCard({ label, value, sub, color, delta, pct }: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  delta?: number | null;
  pct?: number | null; // 0-100 for progress bar
}) {
  const deltaPos = delta != null && delta > 0;
  const deltaNeg = delta != null && delta < 0;
  const sign = deltaPos ? "+" : "";

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border-active)",
      borderRadius: 10,
      padding: "13px 16px",
      flex: 1,
      minWidth: 130,
      display: "flex",
      flexDirection: "column",
      gap: 6,
    }}>
      <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
          {value}
        </div>
        {delta != null && (
          <div style={{
            fontSize: 11, fontWeight: 700,
            color: deltaPos ? "#22c55e" : deltaNeg ? "#ef4444" : "#64748b",
          }}>
            {sign}{typeof delta === "number" ? delta.toFixed(1) : delta}
          </div>
        )}
      </div>
      {pct != null && (
        <div style={{ height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${Math.min(100, Math.max(0, pct))}%`,
            background: color,
            borderRadius: 2,
            transition: "width 0.6s ease",
            opacity: 0.7,
          }} />
        </div>
      )}
      {sub && <div style={{ fontSize: 10, color: "var(--text-faint)" }}>{sub}</div>}
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
  const bRefusal = baseline?.refusal_rate != null ? Math.round(baseline.refusal_rate * 100) : null;
  const bFalseRefusal = baseline?.false_refusal_rate != null ? Math.round(baseline.false_refusal_rate * 100) : null;

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <StatCard
        label="Overall"
        value={overall != null ? overall.toFixed(1) : "—"}
        sub="weighted composite"
        color="var(--accent-hover)"
        pct={overall != null ? overall * 10 : null}
      />
      <StatCard
        label="Safety"
        value={safe != null ? safe.toFixed(1) : "—"}
        sub="avg 0–10"
        color="#818cf8"
        delta={safe != null && bSafe != null ? safe - bSafe : null}
        pct={safe != null ? safe * 10 : null}
      />
      <StatCard
        label="Helpfulness"
        value={help != null ? help.toFixed(1) : "—"}
        sub="avg 0–10"
        color="#22c55e"
        delta={help != null && bHelp != null ? help - bHelp : null}
        pct={help != null ? help * 10 : null}
      />
      <StatCard
        label="Refusal Rate"
        value={refusal != null ? `${refusal}%` : "—"}
        sub="of all prompts"
        color={refusal != null && refusal > 40 ? "#ef4444" : refusal != null && refusal > 20 ? "#f59e0b" : "#22c55e"}
        delta={refusal != null && bRefusal != null ? refusal - bRefusal : null}
        pct={refusal}
      />
      <StatCard
        label="False Refusals"
        value={falseRefusal != null ? `${falseRefusal}%` : "—"}
        sub="safe prompts refused"
        color={falseRefusal != null && falseRefusal > 20 ? "#ef4444" : "#f59e0b"}
        delta={falseRefusal != null && bFalseRefusal != null ? falseRefusal - bFalseRefusal : null}
        pct={falseRefusal}
      />
      <StatCard
        label="Refusal Acc."
        value={rc != null ? rc.toFixed(1) : "—"}
        sub="correct decisions"
        color="#f59e0b"
        pct={rc != null ? rc * 10 : null}
      />
      <StatCard
        label="Policy Follow"
        value={pc != null ? pc.toFixed(1) : "—"}
        sub="rule adherence"
        color="#8b5cf6"
        pct={pc != null ? pc * 10 : null}
      />
    </div>
  );
}
