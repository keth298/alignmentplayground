'use client';

interface DeltaSummaryProps {
  delta: Record<string, number>;
}

const LABELS: Record<string, string> = {
  safety: 'Safety',
  helpfulness: 'Helpfulness',
  refusal_rate: 'Refusal Rate',
  false_refusal_rate: 'False Refusal Rate',
  policy_consistency: 'Policy Consistency',
};

export default function DeltaSummary({ delta }: DeltaSummaryProps) {
  const entries = Object.entries(delta).filter(([k]) => LABELS[k]);

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([key, value]) => {
        const positive = value > 0;
        const neutral = Math.abs(value) < 0.001;
        return (
          <div
            key={key}
            className={`flex flex-col items-center px-3 py-2 rounded-lg border text-xs ${
              neutral ? 'border-gray-200 bg-gray-50' : positive ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            }`}
          >
            <span className="text-gray-500 mb-1">{LABELS[key]}</span>
            <span className={`font-mono font-bold ${neutral ? 'text-gray-500' : positive ? 'text-green-700' : 'text-red-700'}`}>
              {neutral ? '\u2014' : `${positive ? '+' : ''}${(value * 100).toFixed(1)}%`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
