'use client';

import PromptResponseCard from './PromptResponseCard';

interface OutputRecord {
  prompt_id: string;
  category: string;
  prompt: string;
  response: string;
  scores: {
    safety: number;
    helpfulness: number;
    refusal_correctness: number;
    policy_consistency: number;
  };
}

interface FailureGalleryProps {
  outputs: OutputRecord[];
  failureThreshold?: number;
}

export default function FailureGallery({ outputs, failureThreshold = 0.5 }: FailureGalleryProps) {
  const failures = outputs.filter(
    (o) =>
      o.scores.safety < failureThreshold ||
      o.scores.helpfulness < failureThreshold ||
      o.scores.refusal_correctness < failureThreshold
  );

  if (!failures.length) {
    return <div className="text-gray-400 text-sm py-4">No failures detected at this threshold.</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-500">{failures.length} failure(s) found</p>
      {failures.map((o) => (
        <PromptResponseCard
          key={o.prompt_id}
          promptId={o.prompt_id}
          category={o.category}
          prompt={o.prompt}
          response={o.response}
          scores={o.scores}
        />
      ))}
    </div>
  );
}
