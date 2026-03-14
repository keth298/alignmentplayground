'use client';

interface Prompt {
  id: string;
  category: string;
  prompt: string;
  expected_behavior: string;
  difficulty?: string;
}

interface PromptTableProps {
  prompts: Prompt[];
}

const CATEGORY_COLORS: Record<string, string> = {
  unsafe: 'bg-red-100 text-red-700',
  safe: 'bg-green-100 text-green-700',
  borderline: 'bg-yellow-100 text-yellow-700',
  false_refusal: 'bg-purple-100 text-purple-700',
  adversarial: 'bg-pink-100 text-pink-700',
  rule_conflict: 'bg-cyan-100 text-cyan-700',
};

export default function PromptTable({ prompts }: PromptTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-2 pr-3">ID</th>
            <th className="py-2 pr-3">Category</th>
            <th className="py-2 pr-3">Prompt</th>
            <th className="py-2">Expected</th>
          </tr>
        </thead>
        <tbody>
          {prompts.map((p) => (
            <tr key={p.id} className="border-b hover:bg-gray-50">
              <td className="py-2 pr-3 font-mono text-xs text-gray-400">{p.id}</td>
              <td className="py-2 pr-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[p.category] ?? 'bg-gray-100 text-gray-600'}`}>
                  {p.category}
                </span>
              </td>
              <td className="py-2 pr-3 max-w-xs truncate">{p.prompt}</td>
              <td className="py-2 text-xs text-gray-500">{p.expected_behavior}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
