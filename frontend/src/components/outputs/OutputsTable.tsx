"use client";

import { useState } from "react";
import type { RunOutput } from "@/lib/types";
import { CategoryBadge } from "@/components/common/Badge";

function ScorePill({ value, color }: { value: number | null; color: string }) {
  if (value == null) return <span style={{ color: "var(--text-faint)" }}>—</span>;
  return <span style={{ color, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{value.toFixed(1)}</span>;
}

function DeltaChip({ delta }: { delta: number | null }) {
  if (delta == null || Math.abs(delta) < 0.05) return null;
  const pos = delta > 0;
  return (
    <span style={{
      fontSize: 9, fontWeight: 600, marginLeft: 3,
      color: pos ? "#22c55e" : "#ef4444",
    }}>
      {pos ? "+" : ""}{delta.toFixed(1)}
    </span>
  );
}

function OutputRow({ output, baselineOutput }: { output: RunOutput; baselineOutput?: RunOutput }) {
  const [expanded, setExpanded] = useState(false);
  const scored = output.safety_score != null;

  const helpDelta = (scored && baselineOutput?.helpfulness_score != null && output.helpfulness_score != null)
    ? output.helpfulness_score - baselineOutput.helpfulness_score : null;
  const safeDelta = (scored && baselineOutput?.safety_score != null && output.safety_score != null)
    ? output.safety_score - baselineOutput.safety_score : null;

  return (
    <>
      <div
        onClick={() => scored && setExpanded(!expanded)}
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(160px, 1fr) 64px 64px 64px 64px 52px",
          gap: 0,
          padding: "9px 16px",
          borderBottom: expanded ? "none" : "1px solid var(--border)",
          alignItems: "center",
          fontSize: 12,
          cursor: scored ? "pointer" : "default",
          background: expanded ? "#0f1120" : "transparent",
          transition: "background 0.15s",
        }}
        onMouseEnter={e => { if (!expanded) (e.currentTarget as HTMLDivElement).style.background = "#ffffff04"; }}
        onMouseLeave={e => { if (!expanded) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, paddingRight: 8 }}>
          <CategoryBadge category={output.category} />
          <span style={{ color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
            {output.prompt.length > 70 ? output.prompt.slice(0, 67) + "…" : output.prompt}
          </span>
          {scored && (
            <span style={{ color: "var(--text-faint)", fontSize: 10, flexShrink: 0 }}>{expanded ? "▲" : "▼"}</span>
          )}
        </div>
        <div style={{ textAlign: "center" }}>
          <ScorePill value={output.helpfulness_score} color="#22c55e" />
          <DeltaChip delta={helpDelta} />
        </div>
        <div style={{ textAlign: "center" }}>
          <ScorePill value={output.safety_score} color="#818cf8" />
          <DeltaChip delta={safeDelta} />
        </div>
        <div style={{ textAlign: "center" }}>
          <ScorePill value={output.refusal_correctness} color="#f59e0b" />
        </div>
        <div style={{ textAlign: "center" }}>
          <ScorePill value={output.policy_consistency} color="#8b5cf6" />
        </div>
        <div style={{ textAlign: "center" }}>
          {output.refused === null
            ? <span style={{ color: "var(--text-faint)", fontSize: 10 }}>—</span>
            : output.refused
            ? <span style={{ color: "#ef4444", fontSize: 11, fontWeight: 600 }}>Refused</span>
            : <span style={{ color: "#22c55e", fontSize: 11 }}>✓</span>}
        </div>
      </div>

      {expanded && (
        <div className="fade-in" style={{
          padding: "12px 16px 16px",
          borderBottom: "1px solid var(--border)",
          background: "#0f1120",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-faint)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Prompt</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 10px", lineHeight: 1.5 }}>
                {output.prompt}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-faint)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Response</div>
              <div style={{ fontSize: 12, color: "var(--text-primary)", background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 10px", lineHeight: 1.6, maxHeight: 180, overflowY: "auto", whiteSpace: "pre-wrap" }}>
                {output.response || <span style={{ color: "var(--text-faint)" }}>No response</span>}
              </div>
            </div>
          </div>
          {output.judge_reasoning && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, color: "var(--text-faint)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Judge reasoning</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic", lineHeight: 1.5 }}>{output.judge_reasoning}</div>
            </div>
          )}
          <div style={{ marginTop: 8, display: "flex", gap: 16, alignItems: "center" }}>
            {output.error && <span style={{ fontSize: 11, color: "var(--red)" }}>⚠ {output.error}</span>}
            {output.cached && <span style={{ fontSize: 10, color: "#475569" }}>⚡ Cached</span>}
          </div>
        </div>
      )}
    </>
  );
}

interface Props {
  outputs: RunOutput[];
  baselineOutputs?: RunOutput[];
}

export default function OutputsTable({ outputs, baselineOutputs }: Props) {
  const [filter, setFilter] = useState<string>("all");
  const categories = ["all", ...Array.from(new Set(outputs.map(o => o.category)))];
  const baselineMap = Object.fromEntries((baselineOutputs || []).map(o => [o.prompt_id, o]));
  const visible = filter === "all" ? outputs : outputs.filter(o => o.category === filter);

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-active)", borderRadius: 12, overflow: "hidden" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid var(--border)", gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} style={{
              padding: "4px 10px", borderRadius: 6, border: "none", fontSize: 11, fontWeight: 600,
              background: filter === cat ? "var(--accent)" : "var(--bg-panel)",
              color: filter === cat ? "#fff" : "var(--text-muted)",
              cursor: "pointer", transition: "all 0.15s",
            }}>
              {cat === "all" ? `All (${outputs.length})` : cat.replace("_", " ")}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 11, color: "var(--text-faint)" }}>
          {visible.filter(o => o.safety_score != null).length}/{visible.length} scored
        </span>
      </div>

      {/* Scrollable table */}
      <div style={{ overflowX: "auto" }}>
        {/* Column headers */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(160px, 1fr) 64px 64px 64px 64px 52px",
          gap: 0,
          padding: "7px 16px",
          background: "var(--bg-panel)",
          fontSize: 10, fontWeight: 600, color: "var(--text-muted)",
          textTransform: "uppercase", letterSpacing: "0.06em",
          borderBottom: "1px solid var(--border)",
          minWidth: 520,
        }}>
          <div>Prompt</div>
          <div style={{ textAlign: "center", color: "#22c55e" }}>Help</div>
          <div style={{ textAlign: "center", color: "#818cf8" }}>Safety</div>
          <div style={{ textAlign: "center", color: "#f59e0b" }}>Refusal</div>
          <div style={{ textAlign: "center", color: "#8b5cf6" }}>Policy</div>
          <div style={{ textAlign: "center" }}>Status</div>
        </div>

        <div style={{ minWidth: 520 }}>
          {visible.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--text-faint)", fontSize: 13 }}>
              No results in this category
            </div>
          ) : (
            visible.map(o => (
              <OutputRow key={o.id || o.prompt_id} output={o} baselineOutput={baselineMap[o.prompt_id]} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
