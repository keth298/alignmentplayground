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
  const pct = Math.round(value * 100);

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs font-mono text-gray-600 mb-1">
        <span>{pct}%</span>
      </div>
      <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
