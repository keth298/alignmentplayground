export interface Rule {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  weight: number;
  category: "safety" | "helpfulness" | "restriction" | "style";
}

export interface GeneratedPrompt {
  id: string;
  category: string;
  prompt: string;
  expected_behavior: "helpful" | "refuse" | "nuanced";
  difficulty: "easy" | "medium" | "hard";
  rationale: string;
  tags: string[];
}

export interface EdgeCasePrompt {
  id: string;
  category: "rule_edge_case";
  prompt: string;
  expected_behavior: string;
  rule_id: string;
  test_type: "direct_violation" | "compliance" | "edge_case" | "false_positive";
  tags: string[];
  difficulty: string;
  rationale: string;
}

export interface BenchmarkPrompt {
  id: string;
  category: string;
  prompt: string;
  expected_behavior: "helpful" | "refuse" | "nuanced" | "tool_call" | "no_tool_call" | "refuse_tool_call";
  tags: string[];
  difficulty: "easy" | "medium" | "hard";
}

export interface RunOutput {
  id: string;
  prompt_id: string;
  category: string;
  prompt: string;
  expected_behavior: string;
  response: string | null;
  refused: boolean | null;
  safety_score: number | null;
  helpfulness_score: number | null;
  refusal_correctness: number | null;
  policy_consistency: number | null;
  judge_reasoning: string | null;
  tool_call_accuracy: number | null;
  tool_calls_made: Array<{ name: string; args: Record<string, unknown> }> | null;
  error: string | null;
  cached: boolean;
}

export interface CategoryMetrics {
  count: number;
  avg_safety: number;
  avg_helpfulness: number;
  refusal_rate: number;
}

export interface RunMetrics {
  avg_safety: number | null;
  avg_helpfulness: number | null;
  avg_refusal_correctness: number | null;
  avg_policy_consistency: number | null;
  avg_tool_call_accuracy: number | null;
  refusal_rate: number | null;
  false_refusal_rate: number | null;
  overall_score: number | null;
  category_metrics: Record<string, CategoryMetrics> | null;
}

export interface Run {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  benchmark_mode: "live" | "full";
  target_model: string;
  judge_mode: string;
  total_prompts: number;
  completed_prompts: number;
  created_at: string | null;
  completed_at: string | null;
  ruleset: {
    id: string;
    hash: string;
    rules: Rule[];
  } | null;
  avg_safety: number | null;
  avg_helpfulness: number | null;
  avg_refusal_correctness: number | null;
  avg_policy_consistency: number | null;
  avg_tool_call_accuracy: number | null;
  refusal_rate: number | null;
  false_refusal_rate: number | null;
  overall_score: number | null;
  category_metrics: Record<string, CategoryMetrics> | null;
  baseline_model: string | null;
  baseline_metrics: RunMetrics | null;
}

export interface CompareResult {
  run_a: { id: string; metrics: RunMetrics; ruleset: Rule[] };
  run_b: { id: string; metrics: RunMetrics; ruleset: Rule[] };
  deltas: Record<string, number>;
  prompt_diffs: Array<{
    prompt_id: string;
    category: string;
    prompt: string;
    run_a: { safety: number; helpfulness: number; refused: boolean; response: string };
    run_b: { safety: number; helpfulness: number; refused: boolean; response: string };
    delta_safety: number;
    delta_helpfulness: number;
  }>;
}

export interface StreamPayload {
  status: string;
  total_prompts: number;
  completed_prompts: number;
  outputs: RunOutput[];
  baseline_outputs: RunOutput[];
  metrics: RunMetrics | null;
  baseline_metrics: RunMetrics | null;
  baseline_model: string | null;
}
