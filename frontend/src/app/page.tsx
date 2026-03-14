"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ConstitutionPanel from "@/components/rules/ConstitutionPanel";
import MetricsCards from "@/components/dashboard/MetricsCards";
import { SafetyHelpfulnessScatter, CategoryRadar, RefusalRateBar } from "@/components/dashboard/TradeoffChart";
import OutputsTable from "@/components/outputs/OutputsTable";
import RunHistory from "@/components/layout/RunHistory";
import LiveScorePanel, { type Metrics } from "@/components/live-score-panel/LiveScorePanel";
import { api } from "@/lib/api";
import type { Rule, Run, RunOutput, StreamPayload } from "@/lib/types";

function buildSystemPrompt(rules: Rule[]): string {
  const active = rules.filter(r => r.enabled);
  if (!active.length) return "You are a helpful AI assistant.";
  const lines = active.map((r, i) => `${i + 1}. [${r.weight.toFixed(2)}] ${r.label}: ${r.description}`).join("\n");
  return `You are a helpful AI assistant. Follow these rules in order of priority:\n\n${lines}\n\nAlways apply these rules consistently.`;
}

function runToMetrics(run: Run | null, scoredOutputs: RunOutput[]): Metrics | null {
  if (run?.avg_safety != null) {
    return {
      safety: run.avg_safety / 10,
      helpfulness: (run.avg_helpfulness ?? 0) / 10,
      refusal_rate: run.refusal_rate ?? 0,
      false_refusal_rate: run.false_refusal_rate ?? 0,
      policy_consistency: (run.avg_policy_consistency ?? 0) / 10,
    };
  }
  if (scoredOutputs.length > 0) {
    const n = scoredOutputs.length;
    const safe = scoredOutputs.filter(o => o.expected_behavior !== "refuse");
    return {
      safety: scoredOutputs.reduce((s, o) => s + (o.safety_score ?? 0), 0) / n / 10,
      helpfulness: scoredOutputs.reduce((s, o) => s + (o.helpfulness_score ?? 0), 0) / n / 10,
      refusal_rate: scoredOutputs.filter(o => o.refused).length / n,
      false_refusal_rate: safe.length ? safe.filter(o => o.refused).length / safe.length : 0,
      policy_consistency: scoredOutputs.reduce((s, o) => s + (o.policy_consistency ?? 0), 0) / n / 10,
    };
  }
  return null;
}

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total ? Math.round((completed / total) * 100) : 0;
  return (
    <div style={{ padding: "10px 20px", flexShrink: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 5 }}>
        <span>Running benchmark…</span>
        <span>{completed}/{total} · {pct}%</span>
      </div>
      <div style={{ height: 4, background: "var(--border)", borderRadius: 2 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #6366f1, #8b5cf6)", borderRadius: 2, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

export default function Home() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [benchmarkMode, setBenchmarkMode] = useState<"live" | "full">("live");
  const [runs, setRuns] = useState<Run[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [liveOutputs, setLiveOutputs] = useState<RunOutput[]>([]);
  const [liveProgress, setLiveProgress] = useState({ completed: 0, total: 0 });
  const [isRunning, setIsRunning] = useState(false);
  const [baseline, setBaseline] = useState<Run | null>(null);
  const [baselineOutputs, setBaselineOutputs] = useState<RunOutput[]>([]);
  const [pinnedMetrics, setPinnedMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"rules" | "history">("rules");
  const [benchmarkStats, setBenchmarkStats] = useState<{ live_count: number; full_count: number } | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    api.getRules().then(setRules).catch(console.error);
    api.getBenchmarkStats().then(setBenchmarkStats).catch(console.error);
    api.listRuns().then(setRuns).catch(console.error);
  }, []);

  const selectedRun = runs.find(r => r.id === selectedRunId) ?? null;
  const scoredOutputs = liveOutputs.filter(o => o.safety_score != null);

  // Derive metrics for the live score panel
  const liveMetrics = runToMetrics(selectedRun, scoredOutputs);

  const runBenchmark = async () => {
    if (isRunning) return;
    setError(null);
    setIsRunning(true);
    setLiveOutputs([]);
    setLiveProgress({ completed: 0, total: benchmarkStats?.[`${benchmarkMode}_count`] ?? 0 });

    try {
      const { run_id } = await api.createRun({ rules, benchmark_mode: benchmarkMode, judge_mode: "fast" });

      setSelectedRunId(run_id);
      const newRun: Run = {
        id: run_id, status: "pending", benchmark_mode: benchmarkMode,
        target_model: "", judge_mode: "fast",
        total_prompts: benchmarkStats?.[`${benchmarkMode}_count`] ?? 0,
        completed_prompts: 0, created_at: new Date().toISOString(), completed_at: null,
        ruleset: null, avg_safety: null, avg_helpfulness: null,
        avg_refusal_correctness: null, avg_policy_consistency: null,
        refusal_rate: null, false_refusal_rate: null, overall_score: null, category_metrics: null,
      };
      setRuns(prev => [newRun, ...prev]);

      if (esRef.current) esRef.current.close();
      const es = api.streamRun(run_id);
      esRef.current = es;

      es.onmessage = (e) => {
        const payload: StreamPayload = JSON.parse(e.data);
        setLiveOutputs(payload.outputs);
        setLiveProgress({ completed: payload.completed_prompts, total: payload.total_prompts });

        setRuns(prev => prev.map(r => r.id === run_id ? {
          ...r,
          status: payload.status as Run["status"],
          completed_prompts: payload.completed_prompts,
          ...(payload.metrics ? {
            avg_safety: payload.metrics.avg_safety,
            avg_helpfulness: payload.metrics.avg_helpfulness,
            avg_refusal_correctness: payload.metrics.avg_refusal_correctness,
            avg_policy_consistency: payload.metrics.avg_policy_consistency,
            refusal_rate: payload.metrics.refusal_rate,
            false_refusal_rate: payload.metrics.false_refusal_rate,
            overall_score: payload.metrics.overall_score,
            category_metrics: payload.metrics.category_metrics,
          } : {}),
        } : r));

        if (payload.status === "completed" || payload.status === "failed") {
          setIsRunning(false);
          es.close();
        }
      };

      es.onerror = () => {
        setIsRunning(false);
        es.close();
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start run");
      setIsRunning(false);
    }
  };

  const handleSelectRun = useCallback(async (id: string) => {
    setSelectedRunId(id);
    const outputs = await api.getRunOutputs(id).catch(() => []);
    setLiveOutputs(outputs);
  }, []);

  const handleSetBaseline = useCallback(async (run: Run) => {
    setBaseline(run);
    const outputs = await api.getRunOutputs(run.id).catch(() => []);
    setBaselineOutputs(outputs);
  }, []);

  const handleFreezeBaseline = useCallback(() => {
    if (liveMetrics) setPinnedMetrics(liveMetrics);
  }, [liveMetrics]);

  const outputs = liveOutputs;
  const isEmpty = outputs.length === 0;

  // For MetricsCards — build a fakeRun from live outputs when no completed run is selected
  const metricsRun: Run | null = selectedRun ?? (scoredOutputs.length > 0 ? {
    id: "live", status: "running", benchmark_mode: benchmarkMode,
    target_model: "", judge_mode: "fast", total_prompts: liveProgress.total,
    completed_prompts: liveProgress.completed, created_at: null, completed_at: null,
    ruleset: null,
    avg_safety: scoredOutputs.reduce((s, o) => s + (o.safety_score ?? 0), 0) / scoredOutputs.length,
    avg_helpfulness: scoredOutputs.reduce((s, o) => s + (o.helpfulness_score ?? 0), 0) / scoredOutputs.length,
    avg_refusal_correctness: scoredOutputs.reduce((s, o) => s + (o.refusal_correctness ?? 0), 0) / scoredOutputs.length,
    avg_policy_consistency: scoredOutputs.reduce((s, o) => s + (o.policy_consistency ?? 0), 0) / scoredOutputs.length,
    refusal_rate: scoredOutputs.filter(o => o.refused).length / scoredOutputs.length,
    false_refusal_rate: (() => {
      const sa = scoredOutputs.filter(o => o.expected_behavior !== "refuse");
      return sa.length ? sa.filter(o => o.refused).length / sa.length : 0;
    })(),
    overall_score: null,
    category_metrics: null,
  } : null);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {/* ── Header ── */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", height: 52, background: "#0a0c14",
        borderBottom: "1px solid var(--border)", flexShrink: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>⚖️</span>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" }}>Alignment Playground</span>
          <span style={{ fontSize: 10, color: "var(--text-muted)", background: "var(--border)", padding: "2px 7px", borderRadius: 4, fontWeight: 500, textTransform: "uppercase" }}>
            v1.0
          </span>
          {benchmarkStats && (
            <span style={{ fontSize: 11, color: "var(--text-faint)" }}>
              {benchmarkStats.live_count} live · {benchmarkStats.full_count} full prompts
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {baseline && (
            <span style={{ fontSize: 11, color: "#818cf8", background: "#6366f110", padding: "4px 10px", borderRadius: 6 }}>
              📌 Baseline set · deltas shown
            </span>
          )}
          {error && (
            <span style={{ fontSize: 12, color: "var(--red)", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              ⚠ {error}
            </span>
          )}

          <a href="/compare" style={{
            padding: "6px 14px", borderRadius: 8, border: "1px solid var(--border-active)",
            fontSize: 12, fontWeight: 600, color: "var(--text-muted)",
            background: "transparent", cursor: "pointer", textDecoration: "none",
          }}>
            ⇄ Compare
          </a>

          {/* Mode toggle */}
          <div style={{ display: "flex", background: "var(--bg-card)", borderRadius: 8, border: "1px solid var(--border)", overflow: "hidden" }}>
            {(["live", "full"] as const).map(mode => (
              <button key={mode} onClick={() => !isRunning && setBenchmarkMode(mode)} style={{
                padding: "6px 14px", border: "none", fontSize: 12, fontWeight: 600,
                background: benchmarkMode === mode ? "var(--accent)" : "transparent",
                color: benchmarkMode === mode ? "#fff" : "var(--text-muted)",
                cursor: isRunning ? "not-allowed" : "pointer",
                transition: "all 0.15s",
              }}>
                {mode === "live" ? `⚡ Live (${benchmarkStats?.live_count ?? "…"})` : `🔬 Full (${benchmarkStats?.full_count ?? "…"})`}
              </button>
            ))}
          </div>

          <button onClick={runBenchmark} disabled={isRunning} style={{
            padding: "8px 20px", borderRadius: 8, border: "none",
            background: isRunning ? "#374151" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: isRunning ? "#6b7280" : "#fff",
            fontSize: 13, fontWeight: 600, cursor: isRunning ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: 8,
            boxShadow: isRunning ? "none" : "0 0 20px var(--accent-glow)",
            transition: "all 0.2s",
          }}>
            {isRunning
              ? <><span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>◌</span> Running…</>
              : <>▶ Run Benchmark</>}
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left sidebar */}
        <div style={{ width: 300, flexShrink: 0, display: "flex", flexDirection: "column", borderRight: "1px solid var(--border)" }}>
          <div style={{ display: "flex", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
            {(["rules", "history"] as const).map(tab => (
              <button key={tab} onClick={() => setSidebarTab(tab)} style={{
                flex: 1, padding: "10px 0", border: "none", fontSize: 12, fontWeight: 600,
                background: "transparent", cursor: "pointer",
                color: sidebarTab === tab ? "var(--accent-hover)" : "var(--text-muted)",
                borderBottom: sidebarTab === tab ? "2px solid var(--accent)" : "2px solid transparent",
                transition: "all 0.15s",
              }}>
                {tab === "rules" ? "Constitution" : "History"}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflow: "hidden", display: sidebarTab === "rules" ? "flex" : "none", flexDirection: "column" }}>
            <ConstitutionPanel
              rules={rules}
              onChange={setRules}
              systemPrompt={buildSystemPrompt(rules)}
              disabled={isRunning}
            />
          </div>

          <div style={{ flex: 1, overflowY: "auto", display: sidebarTab === "history" ? "block" : "none" }}>
            <RunHistory
              runs={runs}
              selectedRunId={selectedRunId}
              onSelect={handleSelectRun}
              onSetBaseline={handleSetBaseline}
              baselineRunId={baseline?.id ?? null}
            />
          </div>
        </div>

        {/* Main panel */}
        <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
          {isRunning && (
            <ProgressBar completed={liveProgress.completed} total={liveProgress.total} />
          )}

          {isEmpty && !isRunning ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, color: "var(--text-faint)" }}>
              <div style={{ fontSize: 56 }}>⚖️</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-muted)" }}>No results yet</div>
              <div style={{ fontSize: 13, color: "var(--text-faint)", textAlign: "center", maxWidth: 320, lineHeight: 1.6 }}>
                Toggle alignment rules on the left, select a benchmark mode, then click <strong style={{ color: "var(--text-secondary)" }}>Run Benchmark</strong> to see tradeoff curves here.
              </div>
            </div>
          ) : (
            <div style={{ padding: "16px 20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
              {metricsRun && <MetricsCards run={metricsRun} baseline={baseline} />}

              {scoredOutputs.length > 0 && (
                <>
                  <SafetyHelpfulnessScatter outputs={scoredOutputs} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <CategoryRadar outputs={scoredOutputs} />
                    <RefusalRateBar outputs={scoredOutputs} />
                  </div>
                </>
              )}

              {outputs.length > 0 && (
                <OutputsTable outputs={outputs} baselineOutputs={baselineOutputs.length > 0 ? baselineOutputs : undefined} />
              )}
            </div>
          )}
        </div>

        {/* Right panel — Live Score Panel */}
        <LiveScorePanel
          metrics={liveMetrics}
          baseline={pinnedMetrics}
          isPending={isRunning}
          onFreezeBaseline={handleFreezeBaseline}
        />
      </div>
    </div>
  );
}
