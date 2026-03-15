import type { CompareResult, EdgeCasePrompt, GeneratedPrompt, Rule, Run, RunOutput } from "./types";

const BASE = "/api";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `POST ${path} failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getRules: () => get<Rule[]>("/rules/default"),
  getBenchmarkStats: () => get<{ live_count: number; full_count: number; categories: string[]; category_counts: Record<string, number> }>("/benchmarks/stats"),

  generatePrompts: (body: {
    description: string;
    rules: Rule[];
    generator_model?: string;
  }) => post<{ prompts: GeneratedPrompt[]; count: number }>("/prompts/generate", body),

  createRun: (body: {
    rules: Rule[];
    benchmark_mode: string;
    target_model?: string;
    baseline_model?: string;
    judge_mode: string;
    custom_prompts?: GeneratedPrompt[];
  }) => post<{ run_id: string; status: string }>("/runs", body),

  getRun: (id: string) => get<Run>(`/runs/${id}`),
  listRuns: () => get<Run[]>("/runs"),
  getRunOutputs: (id: string) => get<RunOutput[]>(`/runs/${id}/outputs`),
  getBaselineOutputs: (id: string) => get<RunOutput[]>(`/runs/${id}/baseline-outputs`),

  compare: (run_id_a: string, run_id_b: string) =>
    post<CompareResult>("/compare", { run_id_a, run_id_b }),

  generateEdgeCases: (ruleId: string, label: string, description: string) =>
    post<{ rule_id: string; count: number; prompts: EdgeCasePrompt[] }>(
      `/rules/${ruleId}/edge-cases`,
      { label, description },
    ),

  getEdgeCases: (ruleId: string) =>
    get<{ rule_id: string; count: number; prompts: EdgeCasePrompt[] }>(
      `/rules/${ruleId}/edge-cases`,
    ),

  streamRun: (runId: string): EventSource => {
    return new EventSource(`${BASE}/runs/${runId}/stream`);
  },
};
