'use client';

import type { Metrics } from './LiveScorePanel';

interface RadarSummaryChartProps {
  metrics: Metrics;
}

const AXES: { key: keyof Metrics; label: string }[] = [
  { key: 'safety', label: 'Safety' },
  { key: 'helpfulness', label: 'Help' },
  { key: 'policy_consistency', label: 'Policy' },
  { key: 'refusal_rate', label: 'Refusal' },
  { key: 'false_refusal_rate', label: 'False Ref.' },
];

const SIZE = 120;
const CENTER = SIZE / 2;
const RADIUS = 48;

function polar(angle: number, r: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return {
    x: CENTER + r * Math.cos(rad),
    y: CENTER + r * Math.sin(rad),
  };
}

export default function RadarSummaryChart({ metrics }: RadarSummaryChartProps) {
  const n = AXES.length;
  const step = 360 / n;

  const points = AXES.map(({ key }, i) => {
    const value = metrics[key];
    return polar(i * step, value * RADIUS);
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');
  const gridPoints = AXES.map((_, i) => polar(i * step, RADIUS));
  const gridLine = gridPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[140px] mx-auto">
      {/* Grid */}
      <polygon points={gridLine} fill="none" stroke="#e5e7eb" strokeWidth="1" />
      <polygon
        points={AXES.map((_, i) => {
          const p = polar(i * step, RADIUS * 0.5);
          return `${p.x},${p.y}`;
        }).join(' ')}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="0.5"
      />
      {/* Axes */}
      {AXES.map((_, i) => {
        const p = polar(i * step, RADIUS);
        return <line key={i} x1={CENTER} y1={CENTER} x2={p.x} y2={p.y} stroke="#e5e7eb" strokeWidth="0.5" />;
      })}
      {/* Data */}
      <polygon points={polyline} fill="rgba(59,130,246,0.2)" stroke="#3b82f6" strokeWidth="1.5" />
      {/* Labels */}
      {AXES.map(({ label }, i) => {
        const p = polar(i * step, RADIUS + 10);
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="7" fill="#6b7280">
            {label}
          </text>
        );
      })}
    </svg>
  );
}
