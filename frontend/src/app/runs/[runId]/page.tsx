"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import MetricsCards from "@/components/dashboard/MetricsCards";
import { SafetyHelpfulnessScatter, CategoryRadar, RefusalRateBar } from "@/components/dashboard/TradeoffChart";
import OutputsTable from "@/components/outputs/OutputsTable";
import { api } from "@/lib/api";
import type { Run, RunOutput } from "@/lib/types";

export default function RunPage() {
  const { runId } = useParams<{ runId: string }>();
  const router = useRouter();
  const [run, setRun] = useState<Run | null>(null);
  const [outputs, setOutputs] = useState<RunOutput[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getRun(runId), api.getRunOutputs(runId)])
      .then(([r, o]) => { setRun(r); setOutputs(o); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [runId]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--text-muted)" }}>
        Loading run…
      </div>
    );
  }

  if (!run) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: 12 }}>
        <div style={{ color: "var(--text-muted)" }}>Run not found</div>
        <button onClick={() => router.push("/")} style={{ padding: "8px 16px", borderRadius: 8, background: "var(--accent)", border: "none", color: "#fff", cursor: "pointer" }}>
          Back to playground
        </button>
      </div>
    );
  }

  const scored = outputs.filter(o => o.safety_score != null);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 24px", borderBottom: "1px solid var(--border)", background: "#0a0c14" }}>
        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 14 }}>
          ← Back
        </button>
        <span style={{ fontSize: 15, fontWeight: 700 }}>Run detail</span>
        <code style={{ fontSize: 11, color: "var(--text-faint)", background: "var(--bg-card)", padding: "3px 8px", borderRadius: 4 }}>{run.id}</code>
        <span style={{ fontSize: 11, color: run.status === "completed" ? "var(--green)" : run.status === "failed" ? "var(--red)" : "#f59e0b" }}>
          ● {run.status}
        </span>
      </header>

      <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 20, maxWidth: 1400, margin: "0 auto" }}>
        <MetricsCards run={run} />

        {/* Active rules */}
        {run.ruleset?.rules && (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-active)", borderRadius: 12, padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 10 }}>Active rules in this run</h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {run.ruleset.rules.filter(r => r.enabled).map(r => (
                <div key={r.id} style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 10px", fontSize: 11 }}>
                  <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{r.label}</span>
                  <span style={{ color: "var(--text-faint)", marginLeft: 6 }}>{r.weight.toFixed(2)}</span>
                </div>
              ))}
              {run.ruleset.rules.filter(r => r.enabled).length === 0 && (
                <span style={{ color: "var(--text-faint)", fontSize: 12 }}>No active rules</span>
              )}
            </div>
          </div>
        )}

        {scored.length > 0 && (
          <>
            <SafetyHelpfulnessScatter outputs={scored} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <CategoryRadar outputs={scored} />
              <RefusalRateBar outputs={scored} />
            </div>
          </>
        )}

        <OutputsTable outputs={outputs} />
      </div>
    </div>
  );
}
