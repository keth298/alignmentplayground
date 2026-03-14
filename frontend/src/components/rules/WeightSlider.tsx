'use client';

interface WeightSliderProps {
  ruleId: string;
  label: string;
  value: number;
  onChange: (ruleId: string, value: number) => void;
}

export default function WeightSlider({ ruleId, label, value, onChange }: WeightSliderProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-32 truncate">{label}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(ruleId, parseFloat(e.target.value))}
        className="flex-1 accent-blue-600"
      />
      <span className="text-xs font-mono w-8 text-right">{value.toFixed(2)}</span>
    </div>
  );
}
