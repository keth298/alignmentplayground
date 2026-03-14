import { useState } from 'react'

const CATEGORY_BADGE = {
  safety: { bg: '#ef444420', text: '#ef4444', label: 'Safety' },
  helpfulness: { bg: '#22c55e20', text: '#22c55e', label: 'Helpful' },
  restriction: { bg: '#f59e0b20', text: '#f59e0b', label: 'Restrict' },
  style: { bg: '#3b82f620', text: '#3b82f6', label: 'Style' },
}

function RuleCard({ rule, onToggle, onWeightChange }) {
  const badge = CATEGORY_BADGE[rule.category] || CATEGORY_BADGE.style

  return (
    <div style={{
      background: rule.enabled ? '#1e2030' : '#13151f',
      border: `1px solid ${rule.enabled ? '#3b4263' : '#1e2234'}`,
      borderRadius: 10,
      padding: '12px 14px',
      marginBottom: 8,
      transition: 'all 0.2s',
      opacity: rule.enabled ? 1 : 0.6,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Toggle */}
        <button
          onClick={() => onToggle(rule.id)}
          style={{
            flexShrink: 0,
            marginTop: 2,
            width: 36,
            height: 20,
            borderRadius: 10,
            border: 'none',
            background: rule.enabled ? '#6366f1' : '#374151',
            cursor: 'pointer',
            position: 'relative',
            transition: 'background 0.2s',
          }}
          aria-label={`Toggle ${rule.label}`}
        >
          <span style={{
            position: 'absolute',
            top: 2,
            left: rule.enabled ? 18 : 2,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.2s',
            display: 'block',
          }} />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
              {rule.label}
            </span>
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: 4,
              background: badge.bg,
              color: badge.text,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {badge.label}
            </span>
          </div>
          <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4, marginBottom: rule.enabled ? 8 : 0 }}>
            {rule.description}
          </p>

          {rule.enabled && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: '#64748b', width: 44, flexShrink: 0 }}>
                Weight
              </span>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={rule.weight}
                onChange={e => onWeightChange(rule.id, parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: '#6366f1', height: 4 }}
              />
              <span style={{
                fontSize: 11,
                color: '#a5b4fc',
                width: 28,
                textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {rule.weight.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ConstitutionPanel({ rules, onRulesChange, systemPrompt, disabled }) {
  const [showPrompt, setShowPrompt] = useState(false)

  const toggle = (id) => {
    onRulesChange(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
  }

  const setWeight = (id, weight) => {
    onRulesChange(rules.map(r => r.id === id ? { ...r, weight } : r))
  }

  const activeCount = rules.filter(r => r.enabled).length

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#0d0f1a',
      borderRight: '1px solid #1e2234',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid #1e2234', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.01em' }}>
            Constitution Rules
          </h2>
          <span style={{
            fontSize: 11,
            background: '#6366f120',
            color: '#818cf8',
            padding: '3px 8px',
            borderRadius: 6,
            fontWeight: 600,
          }}>
            {activeCount}/{rules.length} active
          </span>
        </div>
        <p style={{ fontSize: 11, color: '#475569' }}>
          Toggle rules on/off and tune weights to explore alignment tradeoffs.
        </p>
      </div>

      {/* Rules List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
        {rules.map(rule => (
          <RuleCard
            key={rule.id}
            rule={rule}
            onToggle={disabled ? () => {} : toggle}
            onWeightChange={disabled ? () => {} : setWeight}
          />
        ))}
      </div>

      {/* System Prompt Preview */}
      <div style={{ borderTop: '1px solid #1e2234', flexShrink: 0 }}>
        <button
          onClick={() => setShowPrompt(!showPrompt)}
          style={{
            width: '100%',
            padding: '10px 16px',
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            fontSize: 11,
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ transform: showPrompt ? 'rotate(90deg)' : 'none', display: 'inline-block', transition: 'transform 0.15s' }}>▶</span>
          Preview system prompt
        </button>
        {showPrompt && (
          <pre style={{
            margin: '0 12px 12px',
            padding: 10,
            background: '#0a0c14',
            border: '1px solid #1e2234',
            borderRadius: 8,
            fontSize: 10,
            color: '#94a3b8',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            lineHeight: 1.6,
            maxHeight: 200,
            overflowY: 'auto',
          }}>
            {systemPrompt}
          </pre>
        )}
      </div>
    </div>
  )
}
