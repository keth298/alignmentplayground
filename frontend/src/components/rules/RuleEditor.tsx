'use client';

import { useState } from 'react';

interface Rule {
  id: string;
  text: string;
  enabled: boolean;
  weight: number;
}

interface RuleEditorProps {
  rules: Rule[];
  onChange: (rules: Rule[]) => void;
}

export default function RuleEditor({ rules, onChange }: RuleEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleTextChange = (id: string, text: string) => {
    onChange(rules.map((r) => (r.id === id ? { ...r, text } : r)));
  };

  const handleAddRule = () => {
    const newRule: Rule = {
      id: `rule_${Date.now()}`,
      text: '',
      enabled: true,
      weight: 1.0,
    };
    onChange([...rules, newRule]);
    setEditingId(newRule.id);
  };

  const handleDelete = (id: string) => {
    onChange(rules.filter((r) => r.id !== id));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Rules</h2>
        <button
          onClick={handleAddRule}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Add Rule
        </button>
      </div>

      {rules.map((rule) => (
        <div key={rule.id} className="border rounded-lg p-3 bg-white shadow-sm">
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={rule.enabled}
              onChange={(e) =>
                onChange(rules.map((r) => (r.id === rule.id ? { ...r, enabled: e.target.checked } : r)))
              }
              className="mt-1"
            />
            {editingId === rule.id ? (
              <textarea
                className="flex-1 border rounded p-1 text-sm resize-none"
                rows={2}
                value={rule.text}
                onChange={(e) => handleTextChange(rule.id, e.target.value)}
                onBlur={() => setEditingId(null)}
                autoFocus
              />
            ) : (
              <span
                className={`flex-1 text-sm cursor-pointer ${!rule.enabled ? 'text-gray-400 line-through' : ''}`}
                onClick={() => setEditingId(rule.id)}
              >
                {rule.text || <span className="italic text-gray-400">Click to edit&hellip;</span>}
              </span>
            )}
            <button
              onClick={() => handleDelete(rule.id)}
              className="text-gray-400 hover:text-red-500 text-xs"
            >
              &times;
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
