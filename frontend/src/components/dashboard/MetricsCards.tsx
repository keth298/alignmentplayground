"use client";

import type { Run } from "@/lib/types";

function StatCard({ label, value, sub, color, pct, baselineValue, baselinePct, baselineModelName }: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  pct?: number | null;
  baselineValue?: string | number | null;
  baselinePct?: number | null;
  baselineModelName?: string | null;
}) {
  const numVal = typeof value === "number" ? value : parseFloat(String(value));
  const numBase = typeof baselineValue === "number" ? baselineValue : parseFloat(String(baselineValue));
  const delta = baselineValue != null && !isNaN(numVal) && !isNaN(numBase) ? numVal - numBase : null;
  const deltaPos = delta != null && delta > 0;
  const deltaNeg = delta != null && delta < 0;

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
      gap: 5,
    }}>
      <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
        {label}
      </div>

      {/* Target value */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
          {value}
        </div>
        {delta != null && (
          <div style={{
            fontSize: 11, fontWeight: 700,
            color: deltaPos ? "#22c55e" : deltaNeg ? "#ef4444" : "#64748b",
          }}>
            {deltaPos ? "+" : ""}{delta.toFixed(1)}
          </div>
        )}
      </div>

      {/* Target bar */}
      {pct != null && (
        <div style={{ height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${Math.min(100, Math.max(0, pct))}%`,
            background: color, borderRadius: 2, transition: "width 0.6s ease", opacity: 0.8,
          }} />
        </div>
      )}

      {/* Baseline section */}
      {baselineValue != null && (
        <div style={{ marginTop: 4, paddingTop: 6, borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 9, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              ◎ {baselineModelName ?? "Baseline"}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", fontVariantNumeric: "tabular-nums" }}>
              {baselineValue}
            </span>
          </div>
          {baselinePct != null && (
            <div style={{ height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${Math.min(100, Math.max(0, baselinePct))}%`,
                background: "#9ca3af", borderRadius: 2, transition: "width 0.6s ease", opacity: 0.6,
              }} />
            </div>
          )}
        </div>
      )}

      {sub && <div style={{ fontSize: 10, color: "var(--text-faint)" }}>{sub}</div>}
    </div>
  );
}

interface Props {
  run: Run;
  baseline?: Run | null;
  baselineModelName?: string | null;
}

export default function MetricsCards({ run, baseline, baselineModelName }: Props) {
  const safe = run.avg_safety;
  const help = run.avg_helpfulness;
  const refusal = run.refusal_rate != null ? Math.round(run.refusal_rate * 100) : null;
  const falseRefusal = run.false_refusal_rate != null ? Math.round(run.false_refusal_rate * 100) : null;
  const rc = run.avg_refusal_correctness;
  const pc = run.avg_policy_consistency;
  const overall = run.overall_score;
  const toolAcc = run.avg_tool_call_accuracy;

  // Prefer run.baseline_metrics over a separate baseline Run
  const bm = run.baseline_metrics ?? null;
  const bSafe = bm?.avg_safety ?? baseline?.avg_safety ?? null;
  const bHelp = bm?.avg_helpfulness ?? baseline?.avg_helpfulness ?? null;
  const bRefusal = (bm?.refusal_rate ?? baseline?.refusal_rate) != null
    ? Math.round((bm?.refusal_rate ?? baseline?.refusal_rate ?? 0) * 100) : null;
  const bFalseRefusal = (bm?.false_refusal_rate ?? baseline?.false_refusal_rate) != null
    ? Math.round((bm?.false_refusal_rate ?? baseline?.false_refusal_rate ?? 0) * 100) : null;
  const bToolAcc = bm?.avg_tool_call_accuracy ?? baseline?.avg_tool_call_accuracy ?? null;

  const hasBaseline = bSafe != null || bHelp != null;
  const modelLabel = hasBaseline
    ? (baselineModelName ?? baseline?.target_model ?? "Baseline")
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {hasBaseline && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 12, height: 3, borderRadius: 2, background: "var(--accent)" }} />
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>{run.target_model || "Target model"}</span>
          <div style={{ width: 20 }} />
          <div style={{ width: 12, height: 3, borderRadius: 2, background: "#9ca3af", opacity: 0.7 }} />
          <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>◎ {modelLabel}</span>
        </div>
      )}
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
          pct={safe != null ? safe * 10 : null}
          baselineValue={bSafe != null ? bSafe.toFixed(1) : null}
          baselinePct={bSafe != null ? bSafe * 10 : null}
          baselineModelName={modelLabel}
        />
        <StatCard
          label="Helpfulness"
          value={help != null ? help.toFixed(1) : "—"}
          sub="avg 0–10"
          color="#22c55e"
          pct={help != null ? help * 10 : null}
          baselineValue={bHelp != null ? bHelp.toFixed(1) : null}
          baselinePct={bHelp != null ? bHelp * 10 : null}
          baselineModelName={modelLabel}
        />
        <StatCard
          label="Refusal Rate"
          value={refusal != null ? `${refusal}%` : "—"}
          sub="of all prompts"
          color={refusal != null && refusal > 40 ? "#ef4444" : refusal != null && refusal > 20 ? "#f59e0b" : "#22c55e"}
          pct={refusal}
          baselineValue={bRefusal != null ? `${bRefusal}%` : null}
          baselinePct={bRefusal}
          baselineModelName={modelLabel}
        />
        <StatCard
          label="False Refusals"
          value={falseRefusal != null ? `${falseRefusal}%` : "—"}
          sub="safe prompts refused"
          color={falseRefusal != null && falseRefusal > 20 ? "#ef4444" : "#f59e0b"}
          pct={falseRefusal}
          baselineValue={bFalseRefusal != null ? `${bFalseRefusal}%` : null}
          baselinePct={bFalseRefusal}
          baselineModelName={modelLabel}
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
        {toolAcc != null && (
          <StatCard
            label="Tool Accuracy"
            value={toolAcc.toFixed(1)}
            sub="tool call correctness"
            color="#06b6d4"
            pct={toolAcc * 10}
            baselineValue={bToolAcc != null ? bToolAcc.toFixed(1) : null}
            baselinePct={bToolAcc != null ? bToolAcc * 10 : null}
            baselineModelName={modelLabel}
          />
        )}
      </div>
    </div>
  );
}
