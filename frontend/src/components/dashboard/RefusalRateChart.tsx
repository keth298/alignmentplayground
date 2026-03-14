'use client';

interface RefusalRateChartProps {
  refusalRate: number;
  falseRefusalRate: number;
}

export default function RefusalRateChart({ refusalRate, falseRefusalRate }: RefusalRateChartProps) {
  const bars = [
    { label: 'Refusal Rate', value: refusalRate, color: '#f59e0b' },
    { label: 'False Refusal Rate', value: falseRefusalRate, color: '#ef4444' },
  ];

  return (
    <div className="flex flex-col gap-3">
      {bars.map(({ label, value, color }) => (
        <div key={label}>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{label}</span>
            <span>{(value * 100).toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${value * 100}%`, backgroundColor: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
