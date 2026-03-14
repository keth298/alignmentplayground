'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Run, CompareResult } from '@/lib/types';

function fmt(v: number | null | undefined, decimals = 1) {
  return v != null ? v.toFixed(decimals) : '—';
}

function pct(v: number | null | undefined) {
  return v != null ? `${Math.round(v * 100)}%` : '—';
}

function Delta({ value }: { value: number | undefined }) {
  if (value == null || Math.abs(value) < 0.0001) return <span style={{ color: 'var(--text-faint)' }}>—</span>;
  const pos = value > 0;
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, fontFamily: 'monospace',
      color: pos ? '#22c55e' : '#ef4444',
    }}>
      {pos ? '+' : ''}{value.toFixed(2)}
    </span>
  );
}

function RunSelect({ runs, value, onChange, label }: {
  runs: Run[];
  value: string;
  onChange: (id: string) => void;
  label: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          padding: '8px 12px', borderRadius: 8, fontSize: 13,
          background: 'var(--bg-card)', color: 'var(--text-primary)',
          border: '1px solid var(--border-active)', cursor: 'pointer',
        }}
      >
        <option value="">— Select a run —</option>
        {runs.filter(r => r.status === 'completed').map(r => (
          <option key={r.id} value={r.id}>
            {r.benchmark_mode === 'full' ? 'Full' : 'Live'} run ·{' '}
            {r.overall_score != null ? `Score ${r.overall_score.toFixed(1)}` : 'no score'} ·{' '}
            {r.completed_at ? new Date(r.completed_at).toLocaleString() : r.created_at ? new Date(r.created_at).toLocaleString() : r.id.slice(0, 8)}
          </option>
        ))}
      </select>
    </div>
  );
}

const METRIC_ROWS: { key: string; label: string; format: (v: number | null | undefined) => string; lowerIsBetter?: boolean }[] = [
  { key: 'overall_score', label: 'Overall Score', format: fmt },
  { key: 'avg_safety', label: 'Safety', format: fmt },
  { key: 'avg_helpfulness', label: 'Helpfulness', format: fmt },
  { key: 'avg_refusal_correctness', label: 'Refusal Accuracy', format: fmt },
  { key: 'avg_policy_consistency', label: 'Policy Follow', format: fmt },
  { key: 'refusal_rate', label: 'Refusal Rate', format: pct, lowerIsBetter: true },
  { key: 'false_refusal_rate', label: 'False Refusals', format: pct, lowerIsBetter: true },
];

export default function ComparePage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [runAId, setRunAId] = useState('');
  const [runBId, setRunBId] = useState('');
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listRuns().then(setRuns).catch(console.error);
  }, []);

  const compare = async () => {
    if (!runAId || !runBId) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.compare(runAId, runBId);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compare failed');
    } finally {
      setLoading(false);
    }
  };

  const canCompare = runAId && runBId && runAId !== runBId;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 52, background: '#0a0c14',
        borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>← Back</a>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em' }}>⇄ Compare Runs</span>
        </div>
      </header>

      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1100, width: '100%', margin: '0 auto' }}>
        {/* Run selectors */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '20px 24px',
        }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
            <RunSelect runs={runs} value={runAId} onChange={setRunAId} label="Run A (baseline)" />
            <div style={{ fontSize: 20, color: 'var(--text-faint)', paddingBottom: 8, flexShrink: 0 }}>⇄</div>
            <RunSelect runs={runs} value={runBId} onChange={setRunBId} label="Run B (comparison)" />
            <button
              onClick={compare}
              disabled={!canCompare || loading}
              style={{
                padding: '9px 22px', borderRadius: 8, border: 'none', flexShrink: 0,
                background: canCompare && !loading ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#374151',
                color: canCompare && !loading ? '#fff' : '#6b7280',
                fontSize: 13, fontWeight: 600, cursor: canCompare && !loading ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s', marginBottom: 0,
              }}
            >
              {loading ? 'Comparing…' : 'Compare →'}
            </button>
          </div>
          {error && (
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--red)' }}>⚠ {error}</div>
          )}
          {runs.filter(r => r.status === 'completed').length === 0 && (
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-faint)' }}>
              No completed runs yet. Run a benchmark from the <a href="/" style={{ color: 'var(--accent-hover)' }}>main page</a> first.
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <>
            {/* Metrics comparison table */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Metrics Comparison
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Metric</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Run A</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Run B</th>
                    <th style={{ padding: '10px 20px', textAlign: 'right', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Delta (B − A)</th>
                  </tr>
                </thead>
                <tbody>
                  {METRIC_ROWS.map((row, i) => {
                    const va = result.run_a.metrics[row.key as keyof typeof result.run_a.metrics] as number | null;
                    const vb = result.run_b.metrics[row.key as keyof typeof result.run_b.metrics] as number | null;
                    const delta = va != null && vb != null ? vb - va : undefined;
                    const adjustedDelta = row.lowerIsBetter && delta != null ? -delta : delta;
                    return (
                      <tr key={row.key} style={{ borderBottom: i < METRIC_ROWS.length - 1 ? '1px solid var(--border)' : 'none', background: i % 2 === 0 ? 'transparent' : '#ffffff04' }}>
                        <td style={{ padding: '10px 20px', fontSize: 13, color: 'var(--text-secondary)' }}>{row.label}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, fontFamily: 'monospace' }}>{row.format(va)}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, fontFamily: 'monospace' }}>{row.format(vb)}</td>
                        <td style={{ padding: '10px 20px', textAlign: 'right' }}>
                          <Delta value={adjustedDelta} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Rule diff */}
            {(result.run_a.ruleset.length > 0 || result.run_b.ruleset.length > 0) && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Rule Configuration
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                  {[
                    { label: 'Run A', ruleset: result.run_a.ruleset },
                    { label: 'Run B', ruleset: result.run_b.ruleset },
                  ].map(({ label, ruleset }, col) => (
                    <div key={col} style={{ padding: '14px 20px', borderRight: col === 0 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-faint)', marginBottom: 10 }}>{label}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {ruleset.map((r: { id: string; enabled: boolean; label: string; weight: number }) => (
                          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                            <span style={{ color: r.enabled ? '#22c55e' : '#ef4444', fontSize: 10 }}>{r.enabled ? '●' : '○'}</span>
                            <span style={{ color: r.enabled ? 'var(--text-secondary)' : 'var(--text-faint)', flex: 1 }}>{r.label}</span>
                            <span style={{ fontFamily: 'monospace', color: 'var(--text-faint)', fontSize: 11 }}>{r.weight.toFixed(1)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt-level diffs */}
            {result.prompt_diffs.length > 0 && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Prompt-level Diffs
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{result.prompt_diffs.length} prompts compared</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '8px 20px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Prompt</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Cat.</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>A Safe</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>B Safe</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Δ Safe</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>A Help</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>B Help</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Δ Help</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Refused</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.prompt_diffs.map((diff, i) => {
                        const bigChange = Math.abs(diff.delta_safety) > 2 || Math.abs(diff.delta_helpfulness) > 2;
                        return (
                          <tr key={diff.prompt_id} style={{
                            borderBottom: '1px solid var(--border)',
                            background: bigChange ? '#6366f108' : i % 2 === 0 ? 'transparent' : '#ffffff03',
                          }}>
                            <td style={{ padding: '8px 20px', fontSize: 12, color: 'var(--text-secondary)', maxWidth: 280 }}>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={diff.prompt}>
                                {diff.prompt}
                              </div>
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              <span style={{
                                fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 600,
                                background: diff.category === 'safe' ? '#22c55e20' : diff.category === 'unsafe' ? '#ef444420' : diff.category === 'false_refusal' ? '#f59e0b20' : '#6366f120',
                                color: diff.category === 'safe' ? '#22c55e' : diff.category === 'unsafe' ? '#ef4444' : diff.category === 'false_refusal' ? '#f59e0b' : '#818cf8',
                              }}>
                                {diff.category}
                              </span>
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: 12, fontFamily: 'monospace' }}>{fmt(diff.run_a.safety)}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: 12, fontFamily: 'monospace' }}>{fmt(diff.run_b.safety)}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}><Delta value={diff.delta_safety} /></td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: 12, fontFamily: 'monospace' }}>{fmt(diff.run_a.helpfulness)}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: 12, fontFamily: 'monospace' }}>{fmt(diff.run_b.helpfulness)}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}><Delta value={diff.delta_helpfulness} /></td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: 11 }}>
                              {diff.run_a.refused !== diff.run_b.refused
                                ? <span style={{ color: '#f59e0b' }}>changed</span>
                                : diff.run_a.refused
                                  ? <span style={{ color: '#ef4444' }}>both</span>
                                  : <span style={{ color: '#22c55e' }}>neither</span>
                              }
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
