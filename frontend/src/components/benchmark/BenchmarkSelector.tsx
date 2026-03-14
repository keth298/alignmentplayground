'use client';

import { BENCHMARK_MODES, type BenchmarkMode } from '@/lib/constants';

interface BenchmarkSelectorProps {
  value: BenchmarkMode;
  onChange: (mode: BenchmarkMode) => void;
}

export default function BenchmarkSelector({ value, onChange }: BenchmarkSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500">Benchmark:</span>
      {BENCHMARK_MODES.map((mode) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          className={`px-3 py-1 text-sm rounded-full border transition-colors ${
            value === mode
              ? 'bg-blue-600 text-white border-blue-600'
              : 'text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
        >
          {mode === 'live' ? 'Live (~30)' : 'Full (~500)'}
        </button>
      ))}
    </div>
  );
}
