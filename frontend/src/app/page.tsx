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

/** Build Metrics (0-1 scale) from a completed run or live scored outputs */
function deriveMetrics(run: Run | null, scoredOutputs: RunOutput[]): Metrics | null {
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
    const shouldAnswer = scoredOutputs.filter(o => o.expected_behavior !== "refuse");
    return {
      safety: scoredOutputs.reduce((s, o) => s + (o.safety_score ?? 0), 0) / n / 10,
      helpfulness: scoredOutputs.reduce((s, o) => s + (o.helpfulness_score ?? 0), 0) / n / 10,
      refusal_rate: scoredOutputs.filter(o => o.refused).length / n,
      false_refusal_rate: shouldAnswer.length
        ? shouldAnswer.filter(o => o.refused).length / shouldAnswer.length
        : 0,
      policy_consistency: scoredOutputs.reduce((s, o) => s + (o.policy_consistency ?? 0), 0) / n / 10,
    };
  }
  return null;
}

/** Build a Run-shaped object from live outputs for MetricsCards */
function buildLiveRun(scoredOutputs: RunOutput[], benchmarkMode: "live" | "full", progress: { completed: number; total: number }): Run {
  const n = scoredOutputs.length;
  const shouldAnswer = scoredOutputs.filter(o => o.expected_behavior !== "refuse");
  return {
    id: "live", status: "running", benchmark_mode: benchmarkMode,
    target_model: "", judge_mode: "fast",
    total_prompts: progress.total, completed_prompts: progress.completed,
    created_at: null, completed_at: null, ruleset: null,
    avg_safety: scoredOutputs.reduce((s, o) => s + (o.safety_score ?? 0), 0) / n,
    avg_helpfulness: scoredOutputs.reduce((s, o) => s + (o.helpfulness_score ?? 0), 0) / n,
    avg_refusal_correctness: scoredOutputs.reduce((s, o) => s + (o.refusal_correctness ?? 0), 0) / n,
    avg_policy_consistency: scoredOutputs.reduce((s, o) => s + (o.policy_consistency ?? 0), 0) / n,
    refusal_rate: scoredOutputs.filter(o => o.refused).length / n,
    false_refusal_rate: shouldAnswer.length ? shouldAnswer.filter(o => o.refused).length / shouldAnswer.length : 0,
    overall_score: null,
    category_metrics: null,
  };
}

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total ? Math.round((completed / total) * 100) : 0;
  return (
    <div style={{ padding: "8px 20px 0", flexShrink: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 5 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "inline-block", animation: "spin 1s linear infinite", color: "var(--accent)" }}>◌</span>
          Running benchmark…
        </span>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{completed}/{total} · {pct}%</span>
      </div>
      <div style={{ height: 3, background: "var(--border)", borderRadius: 2 }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
          borderRadius: 2, transition: "width 0.4s ease",
        }} />
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
  const [showScorePanel, setShowScorePanel] = useState(true);
  const [benchmarkStats, setBenchmarkStats] = useState<{ live_count: number; full_count: number } | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    api.getRules().then(setRules).catch(console.error);
    api.getBenchmarkStats().then(setBenchmarkStats).catch(console.error);
    api.listRuns().then(setRuns).catch(console.error);
  }, []);

  const selectedRun = runs.find(r => r.id === selectedRunId) ?? null;
  const scoredOutputs = liveOutputs.filter(o => o.safety_score != null);

  // Live metrics for the score panel — updates in real-time from scored outputs
  const liveMetrics = deriveMetrics(
    selectedRun?.avg_safety != null ? selectedRun : null,
    scoredOutputs,
  );

  // Run to show in MetricsCards — use live build during active runs, completed run otherwise
  const metricsRun: Run | null =
    selectedRun?.avg_safety != null ? selectedRun
    : scoredOutputs.length > 0 ? buildLiveRun(scoredOutputs, benchmarkMode, liveProgress)
    : selectedRun; // pending, will show "—"

  const runBenchmark = async () => {
    if (isRunning) return;
    setError(null);
    setIsRunning(true);
    setLiveOutputs([]);
    setLiveProgress({ completed: 0, total: benchmarkStats?.[`${benchmarkMode}_count` as keyof typeof benchmarkStats] ?? 0 });

    try {
      const { run_id } = await api.createRun({ rules, benchmark_mode: benchmarkMode, judge_mode: "fast" });

      setSelectedRunId(run_id);
      const newRun: Run = {
        id: run_id, status: "pending", benchmark_mode: benchmarkMode,
        target_model: "", judge_mode: "fast",
        total_prompts: benchmarkStats?.[`${benchmarkMode}_count` as keyof typeof benchmarkStats] ?? 0,
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
      es.onerror = () => { setIsRunning(false); es.close(); };
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

  const isEmpty = liveOutputs.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {/* ── Header ── */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", height: 52, background: "#080a12",
        borderBottom: "1px solid var(--border)", flexShrink: 0, zIndex: 10, gap: 12,
      }}>
        {/* Left: brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
            Alignment Playground
          </span>
          <span style={{ fontSize: 9, color: "var(--text-muted)", background: "var(--border)", padding: "2px 6px", borderRadius: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            v1.0
          </span>
        </div>

        {/* Right: controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {error && (
            <span style={{ fontSize: 11, color: "var(--red)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {error}
            </span>
          )}
          {baseline && !error && (
            <span style={{ fontSize: 11, color: "#818cf8", background: "#6366f110", padding: "3px 8px", borderRadius: 5, flexShrink: 0 }}>
              Baseline active
            </span>
          )}

          <a href="/compare" style={{
            padding: "5px 12px", borderRadius: 7, border: "1px solid var(--border-active)",
            fontSize: 12, fontWeight: 600, color: "var(--text-muted)",
            background: "transparent", textDecoration: "none", flexShrink: 0,
            transition: "all 0.15s",
          }}>
            ⇄ Compare
          </a>

          {/* Benchmark mode */}
          <div style={{ display: "flex", background: "var(--bg-card)", borderRadius: 7, border: "1px solid var(--border)", overflow: "hidden", flexShrink: 0 }}>
            {(["live", "full"] as const).map(mode => (
              <button key={mode} onClick={() => !isRunning && setBenchmarkMode(mode)} style={{
                padding: "5px 12px", border: "none", fontSize: 12, fontWeight: 600,
                background: benchmarkMode === mode ? "var(--accent)" : "transparent",
                color: benchmarkMode === mode ? "#fff" : "var(--text-muted)",
                cursor: isRunning ? "not-allowed" : "pointer", transition: "all 0.15s",
              }}>
                {mode === "live"
                  ? `Live${benchmarkStats ? ` (${benchmarkStats.live_count})` : ""}`
                  : `Full${benchmarkStats ? ` (${benchmarkStats.full_count})` : ""}`}
              </button>
            ))}
          </div>

          {/* Score panel toggle */}
          <button onClick={() => setShowScorePanel(p => !p)} title="Toggle score panel" style={{
            padding: "5px 10px", borderRadius: 7, border: "1px solid var(--border-active)",
            background: showScorePanel ? "#6366f120" : "transparent",
            color: showScorePanel ? "var(--accent-hover)" : "var(--text-muted)",
            fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", flexShrink: 0,
          }}>
            Scores
          </button>

          {/* Run button */}
          <button onClick={runBenchmark} disabled={isRunning} style={{
            padding: "7px 18px", borderRadius: 7, border: "none", flexShrink: 0,
            background: isRunning ? "#1e2234" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: isRunning ? "#64748b" : "#fff",
            fontSize: 13, fontWeight: 700, cursor: isRunning ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: 7,
            boxShadow: isRunning ? "none" : "0 0 16px #6366f140",
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

        {/* ── Left sidebar ── */}
        <div style={{ width: 288, flexShrink: 0, display: "flex", flexDirection: "column", borderRight: "1px solid var(--border)" }}>
          {/* Tab strip */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
            {(["rules", "history"] as const).map(tab => (
              <button key={tab} onClick={() => setSidebarTab(tab)} style={{
                flex: 1, padding: "10px 0", border: "none", fontSize: 12, fontWeight: 600,
                background: "transparent", cursor: "pointer",
                color: sidebarTab === tab ? "var(--accent-hover)" : "var(--text-muted)",
                borderBottom: sidebarTab === tab ? "2px solid var(--accent)" : "2px solid transparent",
                transition: "all 0.15s",
              }}>
                {tab === "rules" ? "Constitution" : `History${runs.length > 0 ? ` (${runs.length})` : ""}`}
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

        {/* ── Main panel ── */}
        <div style={{ flex: 1, minWidth: 0, overflow: "auto", display: "flex", flexDirection: "column" }}>
          {isRunning && (
            <div style={{ padding: "10px 20px 12px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
              <ProgressBar completed={liveProgress.completed} total={liveProgress.total} />
            </div>
          )}

          {isEmpty && !isRunning ? (
            /* ── Empty state ── */
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: 40 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 10 }}>
                  No results yet
                </div>
                <div style={{ fontSize: 13, color: "var(--text-faint)", maxWidth: 340, lineHeight: 1.7 }}>
                  Toggle alignment rules in the <strong style={{ color: "var(--text-muted)" }}>Constitution</strong> panel,
                  choose a benchmark mode, then click{" "}
                  <strong style={{ color: "var(--accent-hover)" }}>Run Benchmark</strong>.
                </div>
              </div>
              <div style={{ display: "flex", gap: 24, marginTop: 8 }}>
                {["Safety scoring", "Helpfulness scoring", "Real-time results"].map(label => (
                  <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: "var(--text-faint)" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ── Results ── */
            <div style={{ padding: "18px 20px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
              {metricsRun && (
                <MetricsCards run={metricsRun} baseline={baseline} />
              )}

              {scoredOutputs.length > 0 && (
                <>
                  <SafetyHelpfulnessScatter outputs={scoredOutputs} />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                    <CategoryRadar outputs={scoredOutputs} />
                    <RefusalRateBar outputs={scoredOutputs} />
                  </div>
                </>
              )}

              {liveOutputs.length > 0 && (
                <OutputsTable
                  outputs={liveOutputs}
                  baselineOutputs={baselineOutputs.length > 0 ? baselineOutputs : undefined}
                />
              )}
            </div>
          )}
        </div>

        {/* ── Right panel: Live Score Panel ── */}
        {showScorePanel && (
          <LiveScorePanel
            metrics={liveMetrics}
            baseline={pinnedMetrics}
            isPending={isRunning}
            onFreezeBaseline={handleFreezeBaseline}
          />
        )}
      </div>
    </div>
  );
}
