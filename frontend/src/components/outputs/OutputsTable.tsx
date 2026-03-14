"use client";

import { useState } from "react";
import type { RunOutput } from "@/lib/types";
import { CategoryBadge } from "@/components/common/Badge";

function ScorePill({ value, color }: { value: number | null; color: string }) {
  if (value == null) return <span style={{ color: "var(--text-faint)" }}>—</span>;
  return <span style={{ color, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{value.toFixed(1)}</span>;
}

function OutputRow({ output, baselineOutput }: { output: RunOutput; baselineOutput?: RunOutput }) {
  const [expanded, setExpanded] = useState(false);
  const scored = output.safety_score != null;

  const helpDelta = (scored && baselineOutput?.helpfulness_score != null && output.helpfulness_score != null)
    ? output.helpfulness_score - baselineOutput.helpfulness_score : null;
  const safeDelta = (scored && baselineOutput?.safety_score != null && output.safety_score != null)
    ? output.safety_score - baselineOutput.safety_score : null;

  const deltaStyle = (d: number) => ({
    fontSize: 10,
    color: d > 0 ? "#22c55e" : d < 0 ? "#ef4444" : "#64748b",
    marginLeft: 4,
  });

  return (
    <>
      <div
        onClick={() => scored && setExpanded(!expanded)}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 56px 56px 56px 56px 52px",
          gap: 6,
          padding: "9px 14px",
          borderBottom: expanded ? "none" : "1px solid var(--border)",
          alignItems: "center",
          fontSize: 12,
          cursor: scored ? "pointer" : "default",
          background: expanded ? "#13151f" : "transparent",
          transition: "background 0.15s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <CategoryBadge category={output.category} />
          <span style={{ color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {output.prompt.length > 60 ? output.prompt.slice(0, 57) + "…" : output.prompt}
          </span>
          {scored && <span style={{ color: "var(--text-faint)", fontSize: 10, flexShrink: 0 }}>{expanded ? "▲" : "▼"}</span>}
        </div>
        <div style={{ textAlign: "center" }}>
          <ScorePill value={output.helpfulness_score} color="var(--green)" />
          {helpDelta != null && <span style={deltaStyle(helpDelta)}>{helpDelta > 0 ? "+" : ""}{helpDelta.toFixed(1)}</span>}
        </div>
        <div style={{ textAlign: "center" }}>
          <ScorePill value={output.safety_score} color="#818cf8" />
          {safeDelta != null && <span style={deltaStyle(safeDelta)}>{safeDelta > 0 ? "+" : ""}{safeDelta.toFixed(1)}</span>}
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
            ? <span style={{ color: "var(--red)", fontSize: 12 }}>⛔</span>
            : <span style={{ color: "var(--green)", fontSize: 12 }}>✓</span>}
        </div>
      </div>

      {expanded && (
        <div className="fade-in" style={{ padding: "10px 14px 14px", borderBottom: "1px solid var(--border)", background: "#13151f" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Prompt</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 10px", lineHeight: 1.5 }}>
                {output.prompt}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Response</div>
              <div style={{ fontSize: 12, color: "var(--text-primary)", background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 10px", lineHeight: 1.6, maxHeight: 160, overflowY: "auto", whiteSpace: "pre-wrap" }}>
                {output.response || <span style={{ color: "var(--text-faint)" }}>No response</span>}
              </div>
            </div>
          </div>
          {output.judge_reasoning && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Judge reasoning</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic", lineHeight: 1.5 }}>{output.judge_reasoning}</div>
            </div>
          )}
          {output.error && (
            <div style={{ marginTop: 8, fontSize: 11, color: "var(--red)" }}>Error: {output.error}</div>
          )}
          {output.cached && (
            <div style={{ marginTop: 4, fontSize: 10, color: "#475569" }}>⚡ Served from cache</div>
          )}
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
      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 4, padding: "10px 14px", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} style={{
            padding: "4px 10px", borderRadius: 6, border: "none", fontSize: 11, fontWeight: 600,
            background: filter === cat ? "var(--accent)" : "var(--bg-panel)",
            color: filter === cat ? "#fff" : "var(--text-muted)",
            cursor: "pointer",
          }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Column headers */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 56px 56px 56px 56px 52px",
        gap: 6,
        padding: "8px 14px",
        background: "var(--bg-panel)",
        fontSize: 10,
        fontWeight: 600,
        color: "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        borderBottom: "1px solid var(--border)",
      }}>
        <div>Prompt <span style={{ fontWeight: 400, textTransform: "none" }}>(click to expand)</span></div>
        <div style={{ textAlign: "center", color: "var(--green)" }}>Help</div>
        <div style={{ textAlign: "center", color: "#818cf8" }}>Safe</div>
        <div style={{ textAlign: "center", color: "#f59e0b" }}>Refusal</div>
        <div style={{ textAlign: "center", color: "#8b5cf6" }}>Policy</div>
        <div style={{ textAlign: "center" }}>Status</div>
      </div>

      <div style={{ maxHeight: 480, overflowY: "auto" }}>
        {visible.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--text-faint)", fontSize: 13 }}>No results yet</div>
        ) : (
          visible.map(o => <OutputRow key={o.id || o.prompt_id} output={o} baselineOutput={baselineMap[o.prompt_id]} />)
        )}
      </div>
    </div>
  );
}
