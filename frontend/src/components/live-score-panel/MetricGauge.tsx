'use client';

const COLORS: Record<string, string> = {
  safety: '#22c55e',
  helpfulness: '#3b82f6',
  refusal_rate: '#f59e0b',
  false_refusal_rate: '#ef4444',
  policy_consistency: '#8b5cf6',
};

interface MetricGaugeProps {
  value: number;
  metricKey: string;
}

export default function MetricGauge({ value, metricKey }: MetricGaugeProps) {
  const color = COLORS[metricKey] ?? '#6b7280';
  const pct = Math.min(100, Math.round(value * 100));

  return (
    <div style={{ width: '100%' }}>
      <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-secondary)', marginBottom: 4 }}>
        {pct}%
      </div>
      <div style={{ height: 5, width: '100%', background: 'var(--bg-card)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          backgroundColor: color,
          borderRadius: 3,
          transition: 'width 0.5s ease-out',
        }} />
      </div>
    </div>
  );
}
