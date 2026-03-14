'use client';

interface DeltaBadgeProps {
  delta: number;
}

export default function DeltaBadge({ delta }: DeltaBadgeProps) {
  if (Math.abs(delta) < 0.001) return null;

  const positive = delta > 0;
  const label = `${positive ? '+' : ''}${(delta * 100).toFixed(1)}%`;

  return (
    <span
      className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded ${
        positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}
    >
      {label}
    </span>
  );
}
