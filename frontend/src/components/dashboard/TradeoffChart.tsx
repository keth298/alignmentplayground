"use client";

import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, Legend,
  BarChart, Bar, Cell, ResponsiveContainer, ReferenceLine,
} from "recharts";
import type { RunOutput } from "@/lib/types";
import { PROMPT_CATEGORY_COLOR } from "@/components/common/Badge";

function ScatterTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: RunOutput & { x: number; y: number } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-active)", borderRadius: 8, padding: "10px 14px", fontSize: 12, maxWidth: 240 }}>
      <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{d.prompt_id}</div>
      <div style={{ color: "var(--green)" }}>Helpfulness: {d.x?.toFixed(1)}/10</div>
      <div style={{ color: "var(--accent-hover)" }}>Safety: {d.y?.toFixed(1)}/10</div>
      {d.refused && <div style={{ color: "var(--red)", marginTop: 4 }}>⛔ Refused</div>}
      <div style={{ color: "var(--text-muted)", marginTop: 4, fontSize: 11 }}>{d.category}</div>
    </div>
  );
}

export function SafetyHelpfulnessScatter({ outputs }: { outputs: RunOutput[] }) {
  const data = outputs
    .filter(o => o.safety_score != null)
    .map(o => ({ ...o, x: o.helpfulness_score ?? 0, y: o.safety_score ?? 0 }));

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-active)", borderRadius: 12, padding: 16 }}>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 12 }}>Safety vs. Helpfulness</h3>
      <ResponsiveContainer width="100%" height={220}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis type="number" dataKey="x" domain={[0, 10]} name="Helpfulness"
            label={{ value: "Helpfulness →", position: "bottom", fill: "var(--text-muted)", fontSize: 11, offset: 10 }}
            tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--border-active)" }} tickLine={false} />
          <YAxis type="number" dataKey="y" domain={[0, 10]} name="Safety"
            label={{ value: "← Safety", angle: -90, position: "insideLeft", fill: "var(--text-muted)", fontSize: 11 }}
            tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--border-active)" }} tickLine={false} />
          <Tooltip content={<ScatterTooltip />} />
          <ReferenceLine x={7} stroke="#6366f120" strokeDasharray="4 4" />
          <ReferenceLine y={7} stroke="#6366f120" strokeDasharray="4 4" />
          <Scatter data={data} shape={(props: { cx: number; cy: number; payload: RunOutput & { x: number; y: number } }) => {
            const color = PROMPT_CATEGORY_COLOR[props.payload.category] || "#888";
            return <circle cx={props.cx} cy={props.cy} r={props.payload.refused ? 7 : 5} fill={color} fillOpacity={0.85} stroke={props.payload.refused ? "#ef4444" : color} strokeWidth={props.payload.refused ? 2 : 0} />;
          }} />
        </ScatterChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
        {Object.entries(PROMPT_CATEGORY_COLOR).map(([cat, color]) => (
          <div key={cat} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-muted)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
            {cat.replace("_", " ")}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CategoryRadar({ outputs }: { outputs: RunOutput[] }) {
  const categories = ["safe", "unsafe", "borderline", "false_refusal", "adversarial", "rule_conflict"];
  const data = categories.map(cat => {
    const cat_outputs = outputs.filter(o => o.category === cat && o.safety_score != null);
    return {
      category: cat.replace("_", " "),
      helpfulness: cat_outputs.length ? +(cat_outputs.reduce((s, o) => s + (o.helpfulness_score || 0), 0) / cat_outputs.length).toFixed(1) : 0,
      safety: cat_outputs.length ? +(cat_outputs.reduce((s, o) => s + (o.safety_score || 0), 0) / cat_outputs.length).toFixed(1) : 0,
    };
  });

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-active)", borderRadius: 12, padding: 16 }}>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>Scores by Category</h3>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={data}>
          <PolarGrid stroke="var(--border-active)" />
          <PolarAngleAxis dataKey="category" tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
          <Radar name="Helpfulness" dataKey="helpfulness" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} />
          <Radar name="Safety" dataKey="safety" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} />
          <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }} iconSize={8} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RefusalRateBar({ outputs }: { outputs: RunOutput[] }) {
  const categories = ["safe", "unsafe", "borderline", "false_refusal", "adversarial", "rule_conflict"];
  const data = categories.map(cat => {
    const cat_outputs = outputs.filter(o => o.category === cat && o.safety_score != null);
    const refused = cat_outputs.filter(o => o.refused);
    return {
      name: cat.replace("_", " "),
      refusals: cat_outputs.length ? Math.round((refused.length / cat_outputs.length) * 100) : 0,
      fill: PROMPT_CATEGORY_COLOR[cat] || "#888",
    };
  });

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-active)", borderRadius: 12, padding: 16 }}>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>Refusal Rate by Category</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 0, right: 10, left: -10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 10 }} angle={-35} textAnchor="end" axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} domain={[0, 100]} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-active)", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "var(--text-secondary)" }} formatter={(v: number) => [`${v}%`, "Refusal rate"]} />
          <Bar dataKey="refusals" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => <Cell key={i} fill={entry.fill} fillOpacity={0.8} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
