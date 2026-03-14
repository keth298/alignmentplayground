// Shared TypeScript types used across frontend and any TS tooling

export interface Rule {
  id: string;
  text: string;
  enabled: boolean;
  weight: number;
}

export interface Ruleset {
  id: string;
  name: string;
  rules: Rule[];
  created_at: string;
}

export interface BenchmarkPrompt {
  id: string;
  category: string;
  prompt: string;
  expected_behavior: string;
  tags: string[];
  difficulty?: string;
}

export interface OutputRecord {
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

export interface AggregateMetrics {
  safety: number;
  helpfulness: number;
  refusal_rate: number;
  false_refusal_rate: number;
  policy_consistency: number;
}

export interface MetricDelta {
  safety: number;
  helpfulness: number;
  refusal_rate: number;
  false_refusal_rate: number;
  policy_consistency: number;
}

export interface Run {
  id: string;
  ruleset_id: string;
  benchmark_mode: 'live' | 'full';
  target_model: string;
  judge_mode: 'local_fast' | 'offline';
  status: 'pending' | 'running' | 'completed' | 'failed';
  metrics?: AggregateMetrics;
  created_at: string;
}
