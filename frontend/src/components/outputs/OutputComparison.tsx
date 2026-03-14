'use client';

interface OutputRecord {
  prompt_id: string;
  prompt: string;
  responseA: string;
  responseB: string;
  scoresA: Record<string, number>;
  scoresB: Record<string, number>;
}

interface OutputComparisonProps {
  record: OutputRecord;
}

export default function OutputComparison({ record }: OutputComparisonProps) {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <p className="text-sm font-medium text-gray-700 mb-3">{record.prompt}</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-semibold text-blue-600 mb-1">Baseline</div>
          <p className="text-xs text-gray-600 bg-gray-50 rounded p-2">{record.responseA}</p>
        </div>
        <div>
          <div className="text-xs font-semibold text-green-600 mb-1">Modified</div>
          <p className="text-xs text-gray-600 bg-gray-50 rounded p-2">{record.responseB}</p>
        </div>
      </div>
    </div>
  );
}
