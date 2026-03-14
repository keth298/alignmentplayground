"use client";

import type { Run } from "@/lib/types";

interface Props {
  runs: Run[];
  selectedRunId: string | null;
  onSelect: (id: string) => void;
  onSetBaseline: (run: Run) => void;
  baselineRunId: string | null;
}

function StatusDot({ status }: { status: string }) {
  const color = status === "completed" ? "#22c55e" : status === "running" ? "#f59e0b" : status === "failed" ? "#ef4444" : "#64748b";
  const pulse = status === "running";
  return (
    <span style={{
      width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0,
      animation: pulse ? "pulse 1.5s ease-in-out infinite" : "none",
    }} />
  );
}

export default function RunHistory({ runs, selectedRunId, onSelect, onSetBaseline, baselineRunId }: Props) {
  if (runs.length === 0) {
    return (
      <div style={{ padding: "20px 16px", color: "var(--text-faint)", fontSize: 12, textAlign: "center" }}>
        No runs yet. Run a benchmark to get started.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {runs.map(run => {
        const selected = run.id === selectedRunId;
        const isBaseline = run.id === baselineRunId;
        return (
          <div
            key={run.id}
            onClick={() => onSelect(run.id)}
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid var(--border)",
              cursor: "pointer",
              background: selected ? "#1e2030" : "transparent",
              transition: "background 0.15s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <StatusDot status={run.status} />
              <span style={{ fontSize: 11, fontWeight: 600, color: selected ? "var(--text-primary)" : "var(--text-secondary)", flex: 1 }}>
                {run.benchmark_mode === "full" ? "Full" : "Live"} run
              </span>
              {isBaseline && (
                <span style={{ fontSize: 9, background: "#6366f120", color: "#818cf8", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
                  BASELINE
                </span>
              )}
              <span style={{ fontSize: 10, color: "var(--text-faint)" }}>
                {run.completed_prompts}/{run.total_prompts}
              </span>
            </div>
            <div style={{ fontSize: 10, color: "var(--text-faint)", display: "flex", gap: 10 }}>
              {run.overall_score != null && (
                <span style={{ color: "#818cf8" }}>Score: {run.overall_score.toFixed(1)}</span>
              )}
              {run.avg_safety != null && <span>Safe: {run.avg_safety.toFixed(1)}</span>}
              {run.avg_helpfulness != null && <span>Help: {run.avg_helpfulness.toFixed(1)}</span>}
            </div>
            {run.status === "completed" && !isBaseline && (
              <button
                onClick={e => { e.stopPropagation(); onSetBaseline(run); }}
                style={{
                  marginTop: 6, padding: "3px 8px", fontSize: 10, borderRadius: 4,
                  border: "1px solid var(--border)", background: "transparent",
                  color: "var(--text-muted)", cursor: "pointer",
                }}
              >
                Set as baseline
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
