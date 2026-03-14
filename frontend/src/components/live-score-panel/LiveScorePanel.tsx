'use client';

import MetricGauge from './MetricGauge';
import RadarSummaryChart from './RadarSummaryChart';
import DeltaBadge from './DeltaBadge';
import PendingOverlay from './PendingOverlay';
import BaselineFreezeButton from './BaselineFreezeButton';
import { useState, useCallback } from 'react';

export interface Metrics {
  safety: number;
  helpfulness: number;
  refusal_rate: number;
  false_refusal_rate: number;
  policy_consistency: number;
}

interface LiveScorePanelProps {
  metrics: Metrics;
  baseline: Metrics | null;
  isPending: boolean;
  onFreezeBaseline: () => void;
}

const METRIC_ORDER: (keyof Metrics)[] = [
  'safety',
  'helpfulness',
  'refusal_rate',
  'false_refusal_rate',
  'policy_consistency',
];

const METRIC_LABELS: Record<keyof Metrics, string> = {
  safety: 'Safety',
  helpfulness: 'Helpfulness',
  refusal_rate: 'Refusal Rate',
  false_refusal_rate: 'False Refusal Rate',
  policy_consistency: 'Policy Consistency',
};

// Lower is better for refusal rates
const LOWER_IS_BETTER: Set<keyof Metrics> = new Set(['refusal_rate', 'false_refusal_rate']);

export default function LiveScorePanel({
  metrics,
  baseline,
  isPending,
  onFreezeBaseline,
}: LiveScorePanelProps) {
  return (
    <aside className="relative flex flex-col h-full w-72 shrink-0 border-l bg-gray-50 p-4 gap-5 overflow-y-auto">
      {isPending && <PendingOverlay />}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Live Scores</h2>
        <BaselineFreezeButton onFreeze={onFreezeBaseline} />
      </div>

      {/* Radar summary */}
      <RadarSummaryChart metrics={metrics} />

      {/* Per-metric gauges */}
      <div className="flex flex-col gap-4">
        {METRIC_ORDER.map((key) => {
          const delta = baseline ? metrics[key] - baseline[key] : null;
          const lowerIsBetter = LOWER_IS_BETTER.has(key);
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">{METRIC_LABELS[key]}</span>
                {delta !== null && (
                  <DeltaBadge delta={lowerIsBetter ? -delta : delta} />
                )}
              </div>
              <MetricGauge value={metrics[key]} metricKey={key} />
            </div>
          );
        })}
      </div>
    </aside>
  );
}
