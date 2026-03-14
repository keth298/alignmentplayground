'use client';

interface Rule {
  id: string;
  text: string;
  enabled: boolean;
  weight: number;
}

interface RuleToggleListProps {
  rules: Rule[];
  onToggle: (id: string, enabled: boolean) => void;
}

export default function RuleToggleList({ rules, onToggle }: RuleToggleListProps) {
  return (
    <ul className="flex flex-col gap-2">
      {rules.map((rule) => (
        <li key={rule.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
          <input
            type="checkbox"
            id={rule.id}
            checked={rule.enabled}
            onChange={(e) => onToggle(rule.id, e.target.checked)}
            className="w-4 h-4 accent-blue-600"
          />
          <label
            htmlFor={rule.id}
            className={`text-sm cursor-pointer select-none ${!rule.enabled ? 'text-gray-400 line-through' : ''}`}
          >
            {rule.text}
          </label>
        </li>
      ))}
    </ul>
  );
}
