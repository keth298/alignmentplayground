'use client';

interface DeltaBadgeProps {
  delta: number;
}

export default function DeltaBadge({ delta }: DeltaBadgeProps) {
  if (Math.abs(delta) < 0.001) return null;

  const positive = delta > 0;
  const label = `${positive ? '+' : ''}${(delta * 100).toFixed(1)}%`;

  return (
    <span style={{
      fontSize: 10,
      fontFamily: 'monospace',
      fontWeight: 600,
      padding: '2px 6px',
      borderRadius: 4,
      background: positive ? '#22c55e20' : '#ef444420',
      color: positive ? '#22c55e' : '#ef4444',
    }}>
      {label}
    </span>
  );
}
