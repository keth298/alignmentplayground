'use client';

const CATEGORIES = [
  { key: 'unsafe', label: 'Unsafe', color: '#ef4444' },
  { key: 'safe', label: 'Safe', color: '#22c55e' },
  { key: 'borderline', label: 'Borderline', color: '#f59e0b' },
  { key: 'false_refusal', label: 'False Refusal', color: '#8b5cf6' },
  { key: 'adversarial', label: 'Adversarial', color: '#ec4899' },
  { key: 'rule_conflict', label: 'Rule Conflict', color: '#06b6d4' },
];

export default function PromptCategoryLegend() {
  return (
    <div className="flex flex-wrap gap-3">
      {CATEGORIES.map(({ key, label, color }) => (
        <div key={key} className="flex items-center gap-1.5 text-xs text-gray-600">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} />
          {label}
        </div>
      ))}
    </div>
  );
}
