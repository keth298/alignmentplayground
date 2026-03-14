import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, Cell, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts'
import { CATEGORY_COLORS } from '../data/benchmarks'

// ─── Small stat card ────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = '#6366f1' }) {
  return (
    <div style={{
      background: '#1e2030',
      border: '1px solid #2d3152',
      borderRadius: 10,
      padding: '14px 18px',
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

// ─── Custom scatter tooltip ──────────────────────────────────────────────────
function ScatterTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: '#1e2030',
      border: '1px solid #3b4263',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 12,
      maxWidth: 220,
    }}>
      <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{d.label}</div>
      <div style={{ color: '#22c55e' }}>Helpfulness: {d.x?.toFixed(1)}/10</div>
      <div style={{ color: '#6366f1' }}>Safety: {d.y?.toFixed(1)}/10</div>
      {d.refused && <div style={{ color: '#ef4444', marginTop: 4 }}>⛔ Refused</div>}
      <div style={{ color: '#64748b', marginTop: 4, fontSize: 11 }}>{d.category}</div>
    </div>
  )
}

// ─── Result row in the results table ────────────────────────────────────────
function ResultRow({ result }) {
  const dot = CATEGORY_COLORS[result.category] || '#888'
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 60px 60px 60px',
      gap: 8,
      padding: '8px 12px',
      borderBottom: '1px solid #1a1d2e',
      alignItems: 'center',
      fontSize: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0 }} />
        <span style={{ color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {result.label}
        </span>
      </div>
      <div style={{ textAlign: 'center', color: '#22c55e', fontVariantNumeric: 'tabular-nums' }}>
        {result.helpfulnessScore?.toFixed(1) ?? '—'}
      </div>
      <div style={{ textAlign: 'center', color: '#6366f1', fontVariantNumeric: 'tabular-nums' }}>
        {result.safetyScore?.toFixed(1) ?? '—'}
      </div>
      <div style={{ textAlign: 'center' }}>
        {result.refused
          ? <span style={{ color: '#ef4444', fontSize: 11 }}>⛔</span>
          : <span style={{ color: '#22c55e', fontSize: 11 }}>✓</span>}
      </div>
    </div>
  )
}

// ─── Main dashboard ──────────────────────────────────────────────────────────
export default function TradeoffDashboard({ results, isRunning, progress, total }) {
  const done = results.filter(r => r.safetyScore !== undefined)
  const refused = done.filter(r => r.refused)

  const avgHelp = done.length
    ? (done.reduce((s, r) => s + (r.helpfulnessScore || 0), 0) / done.length).toFixed(1)
    : '—'
  const avgSafe = done.length
    ? (done.reduce((s, r) => s + (r.safetyScore || 0), 0) / done.length).toFixed(1)
    : '—'
  const refusalRate = done.length
    ? Math.round((refused.length / done.length) * 100)
    : 0

  // Scatter data
  const scatterData = done.map(r => ({
    x: r.helpfulnessScore,
    y: r.safetyScore,
    label: r.label,
    category: r.category,
    refused: r.refused,
  }))

  // Radar by category
  const categories = ['helpful', 'sensitive', 'dual-use', 'unsafe', 'style', 'edge']
  const radarData = categories.map(cat => {
    const catResults = done.filter(r => r.category === cat)
    return {
      category: cat,
      helpfulness: catResults.length
        ? +(catResults.reduce((s, r) => s + (r.helpfulnessScore || 0), 0) / catResults.length).toFixed(1)
        : 0,
      safety: catResults.length
        ? +(catResults.reduce((s, r) => s + (r.safetyScore || 0), 0) / catResults.length).toFixed(1)
        : 0,
    }
  })

  // Bar chart — per-category refusal
  const barData = categories.map(cat => {
    const catDone = done.filter(r => r.category === cat)
    const catRefused = catDone.filter(r => r.refused)
    return {
      name: cat,
      refusals: catDone.length ? Math.round((catRefused.length / catDone.length) * 100) : 0,
      fill: CATEGORY_COLORS[cat] || '#888',
    }
  })

  const isEmpty = done.length === 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top stat cards */}
      <div style={{ display: 'flex', gap: 10, padding: '16px 20px 0', flexShrink: 0 }}>
        <StatCard
          label="Avg Helpfulness"
          value={avgHelp}
          sub={`out of 10 · ${done.length} scored`}
          color="#22c55e"
        />
        <StatCard
          label="Avg Safety"
          value={avgSafe}
          sub={`out of 10 · ${done.length} scored`}
          color="#6366f1"
        />
        <StatCard
          label="Refusal Rate"
          value={`${refusalRate}%`}
          sub={`${refused.length} of ${done.length} refused`}
          color={refusalRate > 40 ? '#ef4444' : refusalRate > 20 ? '#f59e0b' : '#22c55e'}
        />
      </div>

      {/* Progress bar */}
      {isRunning && (
        <div style={{ padding: '10px 20px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 5 }}>
            <span>Running benchmark...</span>
            <span>{progress}/{total}</span>
          </div>
          <div style={{ height: 4, background: '#1e2234', borderRadius: 2 }}>
            <div style={{
              height: '100%',
              width: `${total ? (progress / total) * 100 : 0}%`,
              background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
              borderRadius: 2,
              transition: 'width 0.3s',
            }} />
          </div>
        </div>
      )}

      {/* Charts + table */}
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 20px 20px' }}>
        {isEmpty ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60%',
            color: '#334155',
            gap: 12,
          }}>
            <div style={{ fontSize: 48 }}>⚖️</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#475569' }}>No results yet</div>
            <div style={{ fontSize: 13, color: '#334155', textAlign: 'center', maxWidth: 280 }}>
              Configure your constitution rules on the left, then run the benchmark to see tradeoff curves appear here.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Scatter: Safety vs Helpfulness */}
            <div style={{ background: '#1e2030', border: '1px solid #2d3152', borderRadius: 12, padding: '16px' }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 12 }}>
                Safety vs. Helpfulness Tradeoff
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2234" />
                  <XAxis
                    type="number" dataKey="x" domain={[0, 10]} name="Helpfulness"
                    label={{ value: 'Helpfulness →', position: 'bottom', fill: '#475569', fontSize: 11, offset: 10 }}
                    tick={{ fill: '#475569', fontSize: 11 }} axisLine={{ stroke: '#2d3152' }} tickLine={false}
                  />
                  <YAxis
                    type="number" dataKey="y" domain={[0, 10]} name="Safety"
                    label={{ value: '← Safety', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 11 }}
                    tick={{ fill: '#475569', fontSize: 11 }} axisLine={{ stroke: '#2d3152' }} tickLine={false}
                  />
                  <Tooltip content={<ScatterTooltip />} />
                  {/* Perfect alignment quadrant shading */}
                  <ReferenceLine x={7} stroke="#6366f120" strokeDasharray="4 4" />
                  <ReferenceLine y={7} stroke="#6366f120" strokeDasharray="4 4" />
                  <Scatter
                    data={scatterData}
                    shape={(props) => {
                      const cat = props.payload?.category
                      const color = CATEGORY_COLORS[cat] || '#888'
                      const refused = props.payload?.refused
                      return (
                        <circle
                          cx={props.cx} cy={props.cy} r={refused ? 7 : 5}
                          fill={color} fillOpacity={0.8}
                          stroke={refused ? '#ef4444' : color} strokeWidth={refused ? 2 : 0}
                        />
                      )
                    }}
                  />
                </ScatterChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                  <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748b' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                    {cat}
                  </div>
                ))}
              </div>
            </div>

            {/* Radar + Bar side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {/* Radar */}
              <div style={{ background: '#1e2030', border: '1px solid #2d3152', borderRadius: 12, padding: 16 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>
                  Scores by Category
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#2d3152" />
                    <PolarAngleAxis dataKey="category" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Radar name="Helpfulness" dataKey="helpfulness" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} />
                    <Radar name="Safety" dataKey="safety" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} />
                    <Legend
                      wrapperStyle={{ fontSize: 11, color: '#64748b' }}
                      iconSize={8}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Bar — refusal rate */}
              <div style={{ background: '#1e2030', border: '1px solid #2d3152', borderRadius: 12, padding: 16 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>
                  Refusal Rate by Category (%)
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData} margin={{ top: 0, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2234" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 10 }} angle={-35} textAnchor="end" axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#475569', fontSize: 10 }} domain={[0, 100]} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#1e2030', border: '1px solid #3b4263', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: '#94a3b8' }}
                      formatter={(v) => [`${v}%`, 'Refusal rate']}
                    />
                    <Bar dataKey="refusals" radius={[4, 4, 0, 0]}>
                      {barData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Results table */}
            <div style={{ background: '#1e2030', border: '1px solid #2d3152', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 60px 60px 60px',
                gap: 8,
                padding: '10px 12px',
                borderBottom: '1px solid #2d3152',
                background: '#171929',
                fontSize: 11,
                fontWeight: 600,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>
                <div>Prompt</div>
                <div style={{ textAlign: 'center', color: '#22c55e' }}>Help</div>
                <div style={{ textAlign: 'center', color: '#6366f1' }}>Safe</div>
                <div style={{ textAlign: 'center' }}>Status</div>
              </div>
              {done.map(r => <ResultRow key={r.id} result={r} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
