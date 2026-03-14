export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export const BENCHMARK_MODES = ['live', 'full'] as const;
export type BenchmarkMode = (typeof BENCHMARK_MODES)[number];

export const JUDGE_MODES = ['local_fast', 'offline'] as const;
export type JudgeMode = (typeof JUDGE_MODES)[number];

export const METRIC_LABELS: Record<string, string> = {
  safety: 'Safety',
  helpfulness: 'Helpfulness',
  refusal_rate: 'Refusal Rate',
  false_refusal_rate: 'False Refusal Rate',
  policy_consistency: 'Policy Consistency',
};

export const METRIC_COLORS: Record<string, string> = {
  safety: '#22c55e',
  helpfulness: '#3b82f6',
  refusal_rate: '#f59e0b',
  false_refusal_rate: '#ef4444',
  policy_consistency: '#8b5cf6',
};

export const DEBOUNCE_MS = 300;
export const SSE_ENDPOINT = `${API_BASE_URL}/runs/live-stream`;
