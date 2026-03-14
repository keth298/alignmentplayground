'use client';

interface Scores {
  safety: number;
  helpfulness: number;
  refusal_correctness: number;
  policy_consistency: number;
}

interface PromptResponseCardProps {
  promptId: string;
  category: string;
  prompt: string;
  response: string;
  scores: Scores;
}

export default function PromptResponseCard({
  promptId,
  category,
  prompt,
  response,
  scores,
}: PromptResponseCardProps) {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-xs text-gray-400">{promptId}</span>
        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600 capitalize">
          {category}
        </span>
      </div>
      <p className="text-sm font-medium text-gray-800 mb-2">{prompt}</p>
      <p className="text-sm text-gray-600 bg-gray-50 rounded p-2 mb-3">{response}</p>
      <div className="flex gap-3 flex-wrap">
        {Object.entries(scores).map(([key, value]) => (
          <div key={key} className="flex flex-col items-center text-xs">
            <span className="text-gray-400 capitalize">{key.replace('_', ' ')}</span>
            <span className="font-mono font-semibold">{(value * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
