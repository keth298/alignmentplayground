"use client";

import { useState } from "react";
import type { GeneratedPrompt, Rule } from "@/lib/types";
import { api } from "@/lib/api";

const RULE_CATEGORIES: Rule["category"][] = ["safety", "helpfulness", "restriction", "style"];
const CATEGORY_COLORS: Record<Rule["category"], string> = {
  safety: "#818cf8", helpfulness: "#22c55e", restriction: "#f59e0b", style: "#06b6d4",
};

const GROQ_MODELS = [
  { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
  { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B" },
  { value: "gemma2-9b-it", label: "Gemma 2 9B" },
  { value: "mixtral-8x7b-32768", label: "Mixtral 8x7B" },
];

const CATEGORY_COLOR: Record<string, string> = {
  safe: "#22c55e",
  unsafe: "#ef4444",
  borderline: "#f59e0b",
  false_refusal: "#8b5cf6",
  adversarial: "#f97316",
  rule_conflict: "#ec4899",
};

const EXPECTED_LABEL: Record<string, string> = {
  helpful: "Answer",
  refuse: "Refuse",
  nuanced: "Nuanced",
};

interface SetupScreenProps {
  rules: Rule[];
  onChangeRules: (rules: Rule[]) => void;
  onRun: (opts: {
    description: string;
    targetModel: string;
    baselineModel: string;
    generatorModel: string;
    customPrompts: GeneratedPrompt[];
  }) => void;
}

export default function SetupScreen({ rules, onChangeRules, onRun }: SetupScreenProps) {
  const [description, setDescription] = useState("");
  const [targetModel, setTargetModel] = useState(GROQ_MODELS[0].value);
  const [baselineModel, setBaselineModel] = useState("");
  const [generatorModel, setGeneratorModel] = useState("llama-3.1-8b-instant");
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRuleLabel, setNewRuleLabel] = useState("");
  const [newRuleDesc, setNewRuleDesc] = useState("");
  const [newRuleCat, setNewRuleCat] = useState<Rule["category"]>("safety");
  const [generatedPrompts, setGeneratedPrompts] = useState<GeneratedPrompt[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);

  const canGenerate = description.trim().length > 10;

  const toggleRule = (id: string) =>
    onChangeRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));

  const deleteRule = (id: string) =>
    onChangeRules(rules.filter(r => r.id !== id));

  const addRule = () => {
    if (!newRuleLabel.trim()) return;
    onChangeRules([...rules, {
      id: `custom_${Date.now()}`,
      label: newRuleLabel.trim(),
      description: newRuleDesc.trim() || newRuleLabel.trim(),
      enabled: true,
      weight: 0.8,
      category: newRuleCat,
    }]);
    setNewRuleLabel("");
    setNewRuleDesc("");
    setShowAddRule(false);
  };

  const handleGenerate = async () => {
    if (!canGenerate || isGenerating) return;
    setIsGenerating(true);
    setGenerateError(null);
    setGeneratedPrompts([]);
    try {
      const { prompts } = await api.generatePrompts({
        description,
        rules,
        generator_model: generatorModel,
      });
      setGeneratedPrompts(prompts);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRun = () => {
    if (!generatedPrompts.length) return;
    onRun({ description, targetModel, baselineModel, generatorModel, customPrompts: generatedPrompts });
  };

  const categoryCounts = generatedPrompts.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg-base)",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "48px 24px 80px",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-primary)" }}>
            Alignment Playground
          </span>
          <span style={{ fontSize: 9, color: "var(--text-muted)", background: "var(--border)", padding: "2px 6px", borderRadius: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            v1.0
          </span>
        </div>
        <p style={{ fontSize: 14, color: "var(--text-muted)", maxWidth: 480, lineHeight: 1.7, margin: "0 auto" }}>
          Describe the AI you want to test. A prompt generator will create 25 targeted prompts
          tailored to your model's context and rules.
        </p>
      </div>

      <div style={{ width: "100%", maxWidth: 760, display: "flex", flexDirection: "column", gap: 28 }}>

        {/* Step 1: Describe */}
        <section style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)", padding: 24 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
            1 · Describe your model
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={`e.g. "A financial AI assistant that helps users manage investments, send wire transfers, and monitor their portfolio. Should never execute transactions without explicit confirmation."\n\ne.g. "A CLI coding assistant that can read and write files, run commands, and help debug code. Should refuse to delete system files or run destructive commands."`}
            rows={6}
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 8,
              border: "1px solid var(--border)", background: "var(--bg-base)",
              color: "var(--text-primary)", fontSize: 13, lineHeight: 1.7,
              resize: "vertical", fontFamily: "inherit", boxSizing: "border-box",
            }}
          />
          <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 8 }}>
            Be specific about the domain, use case, and any hard constraints your model should have.
          </div>
        </section>

        {/* Step 2: Models */}
        <section style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)", padding: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
            2 · Select models
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            {[
              { label: "Target Model", sublabel: "The model being evaluated", value: targetModel, setter: setTargetModel, color: "#6366f1", includeNone: false },
              { label: "Baseline Model", sublabel: "Run in gray for comparison", value: baselineModel, setter: setBaselineModel, color: "#9ca3af", includeNone: true },
              { label: "Prompt Generator", sublabel: "Creates the 25 test prompts", value: generatorModel, setter: setGeneratorModel, color: "#22c55e", includeNone: false },
            ].map(({ label, sublabel, value, setter, color, includeNone }) => (
              <div key={label}>
                <div style={{ fontSize: 11, fontWeight: 600, color, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 10, color: "var(--text-faint)", marginBottom: 8 }}>{sublabel}</div>
                <select
                  value={value}
                  onChange={e => setter(e.target.value)}
                  style={{
                    width: "100%", padding: "7px 10px", borderRadius: 7,
                    border: "1px solid var(--border)", background: "var(--bg-base)",
                    color: value ? "var(--text-secondary)" : "var(--text-faint)",
                    fontSize: 12, fontWeight: 500,
                  }}
                >
                  {includeNone && <option value="">None</option>}
                  {GROQ_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            ))}
          </div>
        </section>

        {/* Step 3: Rules */}
        <section style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)", padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              3 · Alignment rules ({rules.filter(r => r.enabled).length} / {rules.length} enabled)
            </div>
            <button
              onClick={() => setShowAddRule(v => !v)}
              style={{
                padding: "4px 12px", borderRadius: 6, border: "1px solid var(--border)",
                background: "transparent", color: "var(--text-muted)", fontSize: 11,
                fontWeight: 600, cursor: "pointer",
              }}
            >
              {showAddRule ? "Cancel" : "+ Add rule"}
            </button>
          </div>

          {/* Add rule form */}
          {showAddRule && (
            <div style={{ marginBottom: 14, padding: 14, borderRadius: 8, background: "var(--bg-base)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
              <input
                value={newRuleLabel}
                onChange={e => setNewRuleLabel(e.target.value)}
                placeholder="Rule name (e.g. Never execute transactions)"
                style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 12 }}
              />
              <input
                value={newRuleDesc}
                onChange={e => setNewRuleDesc(e.target.value)}
                placeholder="Description (optional)"
                style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-primary)", fontSize: 12 }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <select
                  value={newRuleCat}
                  onChange={e => setNewRuleCat(e.target.value as Rule["category"])}
                  style={{ flex: 1, padding: "6px 8px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", fontSize: 12 }}
                >
                  {RULE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button
                  onClick={addRule}
                  disabled={!newRuleLabel.trim()}
                  style={{
                    padding: "6px 16px", borderRadius: 6, border: "none",
                    background: newRuleLabel.trim() ? "#6366f1" : "var(--border)",
                    color: newRuleLabel.trim() ? "#fff" : "#64748b",
                    fontSize: 12, fontWeight: 600, cursor: newRuleLabel.trim() ? "pointer" : "not-allowed",
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Rule list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {rules.length === 0 ? (
              <span style={{ fontSize: 12, color: "var(--text-faint)" }}>No rules yet — add one above.</span>
            ) : rules.map(r => (
              <div key={r.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 12px", borderRadius: 8,
                border: `1px solid ${r.enabled ? "#6366f130" : "var(--border)"}`,
                background: r.enabled ? "#6366f108" : "transparent",
                transition: "all 0.15s",
              }}>
                {/* Toggle */}
                <button
                  onClick={() => toggleRule(r.id)}
                  style={{
                    flexShrink: 0, width: 38, padding: "2px 6px", borderRadius: 4,
                    border: "none", fontSize: 10, fontWeight: 700, cursor: "pointer",
                    background: r.enabled ? "#6366f1" : "var(--border)",
                    color: r.enabled ? "#fff" : "#64748b",
                    transition: "all 0.15s",
                  }}
                >
                  {r.enabled ? "ON" : "OFF"}
                </button>
                {/* Category dot */}
                <span style={{
                  flexShrink: 0, width: 7, height: 7, borderRadius: "50%",
                  background: CATEGORY_COLORS[r.category] ?? "#6b7280", display: "inline-block",
                }} />
                {/* Label */}
                <span style={{ flex: 1, fontSize: 12, color: r.enabled ? "var(--text-secondary)" : "var(--text-faint)", fontWeight: 500 }}>
                  {r.label}
                </span>
                {r.description && r.description !== r.label && (
                  <span style={{ fontSize: 10, color: "var(--text-faint)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.description}
                  </span>
                )}
                {/* Delete */}
                <button
                  onClick={() => deleteRule(r.id)}
                  style={{
                    flexShrink: 0, background: "transparent", border: "none",
                    color: "var(--text-faint)", fontSize: 14, cursor: "pointer", lineHeight: 1,
                    padding: "0 2px",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Generate button */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            style={{
              flex: 1, padding: "13px 24px", borderRadius: 9, border: "none",
              background: (!canGenerate || isGenerating) ? "var(--border)" : "linear-gradient(135deg, #22c55e, #16a34a)",
              color: (!canGenerate || isGenerating) ? "#64748b" : "#fff",
              fontSize: 14, fontWeight: 700, cursor: (!canGenerate || isGenerating) ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: (!canGenerate || isGenerating) ? "none" : "0 0 20px #22c55e30",
              transition: "all 0.2s",
            }}
          >
            {isGenerating
              ? <><span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>◌</span> Generating 25 prompts…</>
              : <>✦ Generate Test Prompts</>}
          </button>
          {!canGenerate && (
            <span style={{ fontSize: 11, color: "var(--text-faint)" }}>
              Add a description to continue
            </span>
          )}
        </div>

        {generateError && (
          <div style={{ padding: "12px 16px", borderRadius: 8, background: "#ef444415", border: "1px solid #ef444430", color: "#ef4444", fontSize: 12 }}>
            {generateError}
          </div>
        )}

        {/* Generated prompts preview */}
        {generatedPrompts.length > 0 && (
          <section style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)", padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Generated prompts ({generatedPrompts.length})
              </div>
              {/* Category breakdown */}
              <div style={{ display: "flex", gap: 6 }}>
                {Object.entries(categoryCounts).map(([cat, count]) => (
                  <span key={cat} style={{
                    padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600,
                    background: `${CATEGORY_COLOR[cat] ?? "#6b7280"}20`,
                    color: CATEGORY_COLOR[cat] ?? "#6b7280",
                  }}>
                    {cat.replace("_", " ")} ×{count}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {generatedPrompts.map((p, i) => (
                <div
                  key={p.id}
                  onClick={() => setExpandedPrompt(expandedPrompt === p.id ? null : p.id)}
                  style={{
                    padding: "10px 12px", borderRadius: 7, cursor: "pointer",
                    border: `1px solid ${expandedPrompt === p.id ? (CATEGORY_COLOR[p.category] ?? "#6b7280") + "40" : "var(--border)"}`,
                    background: expandedPrompt === p.id ? `${CATEGORY_COLOR[p.category] ?? "#6b7280"}08` : "var(--bg-base)",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10, color: "var(--text-faint)", width: 20, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                      {i + 1}
                    </span>
                    <span style={{
                      padding: "2px 7px", borderRadius: 4, fontSize: 9, fontWeight: 700,
                      background: `${CATEGORY_COLOR[p.category] ?? "#6b7280"}20`,
                      color: CATEGORY_COLOR[p.category] ?? "#6b7280",
                      flexShrink: 0, textTransform: "uppercase", letterSpacing: "0.04em",
                    }}>
                      {p.category.replace("_", " ")}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.prompt}
                    </span>
                    <span style={{
                      fontSize: 10, color: p.expected_behavior === "refuse" ? "#ef4444" : p.expected_behavior === "nuanced" ? "#f59e0b" : "#22c55e",
                      flexShrink: 0, fontWeight: 600,
                    }}>
                      {EXPECTED_LABEL[p.expected_behavior] ?? p.expected_behavior}
                    </span>
                  </div>
                  {expandedPrompt === p.id && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                      <p style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.6, margin: "0 0 8px 0" }}>
                        {p.prompt}
                      </p>
                      {p.rationale && (
                        <p style={{ fontSize: 11, color: "var(--text-faint)", fontStyle: "italic", margin: 0 }}>
                          ↳ {p.rationale}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleRun}
              style={{
                marginTop: 20, width: "100%", padding: "13px 24px", borderRadius: 9, border: "none",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 0 20px #6366f140", transition: "all 0.2s",
              }}
            >
              ▶ Run Benchmark with these {generatedPrompts.length} prompts
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
