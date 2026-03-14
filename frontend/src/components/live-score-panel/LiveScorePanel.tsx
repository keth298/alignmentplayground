'use client';

import MetricGauge from './MetricGauge';
import RadarSummaryChart from './RadarSummaryChart';
import DeltaBadge from './DeltaBadge';
import PendingOverlay from './PendingOverlay';
import BaselineFreezeButton from './BaselineFreezeButton';

export interface Metrics {
  safety: number;
  helpfulness: number;
  refusal_rate: number;
  false_refusal_rate: number;
  policy_consistency: number;
}

interface LiveScorePanelProps {
  metrics: Metrics | null;
  baseline: Metrics | null;
  isPending: boolean;
  onFreezeBaseline: () => void;
}

const METRIC_ORDER: (keyof Metrics)[] = [
  'safety',
  'helpfulness',
  'policy_consistency',
  'refusal_rate',
  'false_refusal_rate',
];

const METRIC_LABELS: Record<keyof Metrics, string> = {
  safety: 'Safety',
  helpfulness: 'Helpfulness',
  refusal_rate: 'Refusal Rate',
  false_refusal_rate: 'False Refusals',
  policy_consistency: 'Policy Follow',
};

// Lower is better for refusal metrics
const LOWER_IS_BETTER: Set<keyof Metrics> = new Set(['refusal_rate', 'false_refusal_rate']);

const EMPTY_METRICS: Metrics = { safety: 0, helpfulness: 0, refusal_rate: 0, false_refusal_rate: 0, policy_consistency: 0 };

export default function LiveScorePanel({ metrics, baseline, isPending, onFreezeBaseline }: LiveScorePanelProps) {
  const current = metrics ?? EMPTY_METRICS;

  return (
    <aside style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      width: 220,
      flexShrink: 0,
      borderLeft: '1px solid var(--border)',
      background: 'var(--bg-panel)',
      padding: '14px 12px',
      gap: 14,
      overflowY: 'auto',
    }}>
      {isPending && <PendingOverlay />}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Live Scores
        </h2>
        {metrics && <BaselineFreezeButton onFreeze={onFreezeBaseline} />}
      </div>

      {/* Radar */}
      {metrics ? (
        <RadarSummaryChart metrics={current} baseline={baseline} />
      ) : (
        <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', fontSize: 11, textAlign: 'center' }}>
          Run a benchmark to<br />see scores here
        </div>
      )}

      {/* Per-metric gauges */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {METRIC_ORDER.map(key => {
          const val = current[key];
          const delta = baseline ? metrics ? current[key] - baseline[key] : null : null;
          const lowerIsBetter = LOWER_IS_BETTER.has(key);
          return (
            <div key={key}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{METRIC_LABELS[key]}</span>
                {delta !== null && <DeltaBadge delta={lowerIsBetter ? -delta : delta} />}
              </div>
              <MetricGauge value={metrics ? val : 0} metricKey={key} />
            </div>
          );
        })}
      </div>

      {baseline && (
        <div style={{ fontSize: 10, color: 'var(--text-faint)', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
          📌 Baseline pinned · deltas shown above
        </div>
      )}
    </aside>
  );
}
