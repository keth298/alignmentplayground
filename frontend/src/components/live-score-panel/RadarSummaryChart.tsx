'use client';

import type { Metrics } from './LiveScorePanel';

interface RadarSummaryChartProps {
  metrics: Metrics;
  baseline?: Metrics | null;
}

const AXES: { key: keyof Metrics; label: string }[] = [
  { key: 'safety', label: 'Safety' },
  { key: 'helpfulness', label: 'Help' },
  { key: 'policy_consistency', label: 'Policy' },
  { key: 'tool_call_accuracy', label: 'Tools' },
  { key: 'refusal_rate', label: 'Refusal' },
  { key: 'false_refusal_rate', label: 'False Ref.' },
];

const SIZE = 130;
const CENTER = SIZE / 2;
const RADIUS = 50;

function polar(angle: number, r: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
}

export default function RadarSummaryChart({ metrics, baseline }: RadarSummaryChartProps) {
  const n = AXES.length;
  const step = 360 / n;

  const points = AXES.map(({ key }, i) => polar(i * step, metrics[key] * RADIUS));
  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');

  const baselinePoints = baseline
    ? AXES.map(({ key }, i) => polar(i * step, baseline[key] * RADIUS))
    : null;
  const baselinePolyline = baselinePoints?.map(p => `${p.x},${p.y}`).join(' ');

  const gridOuter = AXES.map((_, i) => polar(i * step, RADIUS));
  const gridMid = AXES.map((_, i) => polar(i * step, RADIUS * 0.5));

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ width: '100%', maxWidth: 150, margin: '0 auto', display: 'block' }}>
      {/* Grid rings */}
      <polygon points={gridOuter.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#1e2234" strokeWidth="1" />
      <polygon points={gridMid.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#1e2234" strokeWidth="0.5" />
      {/* Axes */}
      {AXES.map((_, i) => {
        const p = polar(i * step, RADIUS);
        return <line key={i} x1={CENTER} y1={CENTER} x2={p.x} y2={p.y} stroke="#1e2234" strokeWidth="0.5" />;
      })}
      {/* Baseline */}
      {baselinePolyline && (
        <polygon points={baselinePolyline} fill="rgba(99,102,241,0.08)" stroke="#6366f160" strokeWidth="1" strokeDasharray="2 2" />
      )}
      {/* Data */}
      <polygon points={polyline} fill="rgba(99,102,241,0.2)" stroke="#6366f1" strokeWidth="1.5" />
      {/* Labels */}
      {AXES.map(({ label }, i) => {
        const p = polar(i * step, RADIUS + 12);
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="7" fill="#64748b">
            {label}
          </text>
        );
      })}
    </svg>
  );
}
