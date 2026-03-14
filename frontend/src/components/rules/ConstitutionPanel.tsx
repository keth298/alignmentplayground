"use client";

import { useState } from "react";
import type { Rule } from "@/lib/types";
import { CategoryBadge } from "@/components/common/Badge";

const CATEGORIES: Rule["category"][] = ["safety", "helpfulness", "restriction", "style"];

function WeightSlider({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, width: "100%" }}>
      <span style={{ fontSize: 10, color: "var(--text-muted)", width: 44, flexShrink: 0 }}>Weight</span>
      <input
        type="range" min="0.1" max="1.0" step="0.05"
        value={value} onChange={e => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        style={{ flex: 1, minWidth: 0, accentColor: "var(--accent)", height: 4, background: "transparent", border: "none" }}
      />
      <span style={{ fontSize: 11, color: "#a5b4fc", width: 32, textAlign: "right", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
        {value.toFixed(2)}
      </span>
    </div>
  );
}

function RuleEditForm({ rule, onSave, onCancel }: { rule: Rule; onSave: (patch: Partial<Rule>) => void; onCancel: () => void }) {
  const [label, setLabel] = useState(rule.label);
  const [description, setDescription] = useState(rule.description);
  const [category, setCategory] = useState(rule.category);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
      <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Rule name"
        style={{ padding: "6px 8px", fontSize: 12, width: "100%" }} />
      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" rows={2}
        style={{ padding: "6px 8px", fontSize: 11, resize: "vertical", width: "100%" }} />
      <select value={category} onChange={e => setCategory(e.target.value as Rule["category"])}
        style={{ padding: "5px 8px", fontSize: 11 }}>
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={() => onSave({ label, description, category })}
          style={{ flex: 1, padding: "6px 0", background: "var(--accent)", border: "none", color: "#fff", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
          Save
        </button>
        <button onClick={onCancel}
          style={{ flex: 1, padding: "6px 0", background: "transparent", border: "1px solid var(--border-active)", color: "var(--text-muted)", borderRadius: 6, fontSize: 12 }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function RuleCard({ rule, onToggle, onWeightChange, onDelete, onEdit, disabled }: {
  rule: Rule;
  onToggle: (id: string) => void;
  onWeightChange: (id: string, w: number) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, patch: Partial<Rule>) => void;
  disabled: boolean;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="fade-in" style={{
      background: rule.enabled ? "var(--bg-card)" : "#13151f",
      border: `1px solid ${rule.enabled ? "var(--border-active)" : "var(--border)"}`,
      borderRadius: 10,
      padding: "12px 14px",
      marginBottom: 8,
      opacity: rule.enabled ? 1 : 0.6,
      transition: "all 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        {/* Toggle */}
        <button onClick={() => !disabled && onToggle(rule.id)} style={{
          flexShrink: 0, marginTop: 2,
          width: 36, height: 20, borderRadius: 10, border: "none",
          background: rule.enabled ? "var(--accent)" : "#374151",
          position: "relative", transition: "background 0.2s",
        }}>
          <span style={{
            position: "absolute", top: 2, left: rule.enabled ? 18 : 2,
            width: 16, height: 16, borderRadius: "50%", background: "#fff",
            transition: "left 0.2s", display: "block",
          }} />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{rule.label}</span>
            <CategoryBadge category={rule.category} />
          </div>
          <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>{rule.description}</p>
          {rule.enabled && !editing && (
            <WeightSlider value={rule.weight} onChange={w => onWeightChange(rule.id, w)} disabled={disabled} />
          )}
          {editing && (
            <RuleEditForm rule={rule}
              onSave={patch => { onEdit(rule.id, patch); setEditing(false); }}
              onCancel={() => setEditing(false)} />
          )}
        </div>

        {!disabled && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
            <button onClick={() => setEditing(!editing)} title="Edit" style={{ background: "none", border: "none", color: "var(--text-faint)", fontSize: 13, padding: "2px 3px" }}>Edit</button>
            <button onClick={() => onDelete(rule.id)} title="Delete" style={{ background: "none", border: "none", color: "var(--text-faint)", fontSize: 13, padding: "2px 3px" }}>Del</button>
          </div>
        )}
      </div>
    </div>
  );
}

function AddRuleForm({ onAdd, onCancel }: { onAdd: (r: Rule) => void; onCancel: () => void }) {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Rule["category"]>("safety");
  const [weight, setWeight] = useState(0.7);

  const submit = () => {
    if (!label.trim()) return;
    onAdd({ id: `custom_${Date.now()}`, label: label.trim(), description: description.trim() || label.trim(), category, enabled: true, weight });
  };

  return (
    <div className="fade-in" style={{ background: "var(--bg-card)", border: "1px solid var(--accent)", borderRadius: 10, padding: "12px 14px", marginBottom: 8 }}>
      <div style={{ fontSize: 10, color: "var(--accent-hover)", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>New Rule</div>
      <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Rule name" autoFocus
        style={{ padding: "6px 8px", fontSize: 12, width: "100%", marginBottom: 6 }} />
      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" rows={3}
        style={{ padding: "6px 8px", fontSize: 12, resize: "vertical", width: "100%", marginBottom: 6 }} />
      <select value={category} onChange={e => setCategory(e.target.value as Rule["category"])}
        style={{ width: "100%", padding: "5px 8px", fontSize: 11, marginBottom: 4 }}>
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <WeightSlider value={weight} onChange={setWeight} disabled={false} />
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <button onClick={submit} disabled={!label.trim()}
          style={{ flex: 1, padding: "6px 0", background: label.trim() ? "var(--accent)" : "#374151", border: "none", color: label.trim() ? "#fff" : "#6b7280", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
          Add Rule
        </button>
        <button onClick={onCancel}
          style={{ flex: 1, padding: "6px 0", background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: 6, fontSize: 12 }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

interface Props {
  rules: Rule[];
  onChange: (rules: Rule[]) => void;
  systemPrompt: string;
  disabled: boolean;
}

export default function ConstitutionPanel({ rules, onChange, systemPrompt, disabled }: Props) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [adding, setAdding] = useState(false);

  const toggle = (id: string) => onChange(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  const setWeight = (id: string, w: number) => onChange(rules.map(r => r.id === id ? { ...r, weight: w } : r));
  const deleteRule = (id: string) => onChange(rules.filter(r => r.id !== id));
  const editRule = (id: string, patch: Partial<Rule>) => onChange(rules.map(r => r.id === id ? { ...r, ...patch } : r));
  const addRule = (rule: Rule) => { onChange([...rules, rule]); setAdding(false); };

  const activeCount = rules.filter(r => r.enabled).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-panel)" }}>
      {/* Header */}
      <div style={{ padding: "20px 20px 14px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Constitution</h2>
          <span style={{ fontSize: 11, background: "#6366f120", color: "#818cf8", padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>
            {activeCount}/{rules.length} active
          </span>
        </div>
        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Toggle rules and tune weights to shape model behavior.</p>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>
        {adding && <AddRuleForm onAdd={addRule} onCancel={() => setAdding(false)} />}
        {rules.map(rule => (
          <RuleCard key={rule.id} rule={rule}
            onToggle={toggle} onWeightChange={setWeight}
            onDelete={deleteRule} onEdit={editRule} disabled={disabled} />
        ))}
        {!disabled && !adding && (
          <button onClick={() => setAdding(true)} style={{
            width: "100%", padding: "8px 0", borderRadius: 8,
            border: "1px dashed var(--border-active)", background: "transparent",
            color: "var(--text-muted)", fontSize: 12, marginTop: 4,
          }}>
            + Add custom rule
          </button>
        )}
      </div>

      {/* System prompt preview */}
      <div style={{ borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        <button onClick={() => setShowPrompt(!showPrompt)} style={{
          width: "100%", padding: "10px 16px", background: "transparent",
          border: "none", color: "var(--text-muted)", fontSize: 11,
          textAlign: "left", display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{ transform: showPrompt ? "rotate(90deg)" : "none", display: "inline-block", transition: "transform 0.15s" }}>▶</span>
          Preview system prompt
        </button>
        {showPrompt && (
          <pre style={{
            margin: "0 12px 12px", padding: 10, background: "var(--bg-base)",
            border: "1px solid var(--border)", borderRadius: 8, fontSize: 10,
            color: "var(--text-secondary)", whiteSpace: "pre-wrap", wordBreak: "break-word",
            lineHeight: 1.6, maxHeight: 200, overflowY: "auto",
          }}>
            {systemPrompt}
          </pre>
        )}
      </div>
    </div>
  );
}
