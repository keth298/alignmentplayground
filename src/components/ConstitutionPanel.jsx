import { useState } from 'react'

const CATEGORY_BADGE = {
  safety: { bg: '#ef444420', text: '#ef4444', label: 'Safety' },
  helpfulness: { bg: '#22c55e20', text: '#22c55e', label: 'Helpful' },
  restriction: { bg: '#f59e0b20', text: '#f59e0b', label: 'Restrict' },
  style: { bg: '#3b82f620', text: '#3b82f6', label: 'Style' },
}

const CATEGORIES = ['safety', 'helpfulness', 'restriction', 'style']

function RuleCard({ rule, onToggle, onWeightChange, onDelete, onEdit, disabled }) {
  const badge = CATEGORY_BADGE[rule.category] || CATEGORY_BADGE.style
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ label: rule.label, description: rule.description, category: rule.category })

  const saveEdit = () => {
    if (draft.label.trim()) {
      onEdit(rule.id, draft)
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <div style={{
        background: '#1e2030',
        border: '1px solid #6366f1',
        borderRadius: 10,
        padding: '12px 14px',
        marginBottom: 8,
      }}>
        <input
          value={draft.label}
          onChange={e => setDraft(d => ({ ...d, label: e.target.value }))}
          placeholder="Rule name"
          style={{
            width: '100%',
            background: '#0d0f1a',
            border: '1px solid #2d3152',
            borderRadius: 6,
            padding: '6px 8px',
            color: '#e2e8f0',
            fontSize: 12,
            marginBottom: 6,
            boxSizing: 'border-box',
          }}
        />
        <textarea
          value={draft.description}
          onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
          placeholder="Description"
          rows={2}
          style={{
            width: '100%',
            background: '#0d0f1a',
            border: '1px solid #2d3152',
            borderRadius: 6,
            padding: '6px 8px',
            color: '#94a3b8',
            fontSize: 11,
            resize: 'vertical',
            marginBottom: 6,
            boxSizing: 'border-box',
          }}
        />
        <select
          value={draft.category}
          onChange={e => setDraft(d => ({ ...d, category: e.target.value }))}
          style={{
            background: '#0d0f1a',
            border: '1px solid #2d3152',
            borderRadius: 6,
            padding: '5px 8px',
            color: '#94a3b8',
            fontSize: 11,
            marginBottom: 8,
          }}
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={saveEdit} style={{ flex: 1, padding: '5px 0', borderRadius: 6, border: 'none', background: '#6366f1', color: '#fff', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
            Save
          </button>
          <button onClick={() => setEditing(false)} style={{ flex: 1, padding: '5px 0', borderRadius: 6, border: '1px solid #2d3152', background: 'transparent', color: '#64748b', fontSize: 11, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

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
          onClick={() => !disabled && onToggle(rule.id)}
          style={{
            flexShrink: 0,
            marginTop: 2,
            width: 36,
            height: 20,
            borderRadius: 10,
            border: 'none',
            background: rule.enabled ? '#6366f1' : '#374151',
            cursor: disabled ? 'not-allowed' : 'pointer',
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
                onChange={e => !disabled && onWeightChange(rule.id, parseFloat(e.target.value))}
                disabled={disabled}
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

        {/* Edit / Delete */}
        {!disabled && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
            <button
              onClick={() => setEditing(true)}
              title="Edit rule"
              style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 12, padding: '2px 4px' }}
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(rule.id)}
              title="Delete rule"
              style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 12, padding: '2px 4px' }}
            >
              🗑️
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Add Rule form ────────────────────────────────────────────────────────────
function AddRuleForm({ onAdd, onCancel }) {
  const [form, setForm] = useState({ label: '', description: '', category: 'safety', weight: 0.7 })

  const submit = () => {
    if (!form.label.trim()) return
    onAdd({
      id: `custom_${Date.now()}`,
      label: form.label.trim(),
      description: form.description.trim() || form.label.trim(),
      category: form.category,
      enabled: true,
      weight: form.weight,
    })
  }

  return (
    <div style={{
      background: '#1e2030',
      border: '1px solid #6366f1',
      borderRadius: 10,
      padding: '12px 14px',
      marginBottom: 8,
    }}>
      <div style={{ fontSize: 11, color: '#818cf8', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        New Rule
      </div>
      <input
        value={form.label}
        onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
        placeholder="Rule name (e.g. Always be formal)"
        autoFocus
        style={{
          width: '100%',
          background: '#0d0f1a',
          border: '1px solid #2d3152',
          borderRadius: 6,
          padding: '6px 8px',
          color: '#e2e8f0',
          fontSize: 12,
          marginBottom: 6,
          boxSizing: 'border-box',
        }}
      />
      <textarea
        value={form.description}
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        placeholder="Description (optional)"
        rows={2}
        style={{
          width: '100%',
          background: '#0d0f1a',
          border: '1px solid #2d3152',
          borderRadius: 6,
          padding: '6px 8px',
          color: '#94a3b8',
          fontSize: 11,
          resize: 'vertical',
          marginBottom: 6,
          boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
        <select
          value={form.category}
          onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
          style={{
            flex: 1,
            background: '#0d0f1a',
            border: '1px solid #2d3152',
            borderRadius: 6,
            padding: '5px 8px',
            color: '#94a3b8',
            fontSize: 11,
          }}
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span style={{ fontSize: 10, color: '#64748b' }}>Weight</span>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.05"
          value={form.weight}
          onChange={e => setForm(f => ({ ...f, weight: parseFloat(e.target.value) }))}
          style={{ flex: 1, accentColor: '#6366f1' }}
        />
        <span style={{ fontSize: 11, color: '#a5b4fc', width: 28, textAlign: 'right' }}>
          {form.weight.toFixed(2)}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={submit}
          disabled={!form.label.trim()}
          style={{
            flex: 1,
            padding: '6px 0',
            borderRadius: 6,
            border: 'none',
            background: form.label.trim() ? '#6366f1' : '#374151',
            color: form.label.trim() ? '#fff' : '#6b7280',
            fontSize: 12,
            cursor: form.label.trim() ? 'pointer' : 'not-allowed',
            fontWeight: 600,
          }}
        >
          Add Rule
        </button>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '6px 0',
            borderRadius: 6,
            border: '1px solid #2d3152',
            background: 'transparent',
            color: '#64748b',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────
export default function ConstitutionPanel({ rules, onRulesChange, systemPrompt, disabled }) {
  const [showPrompt, setShowPrompt] = useState(false)
  const [adding, setAdding] = useState(false)

  const toggle = (id) => {
    onRulesChange(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
  }

  const setWeight = (id, weight) => {
    onRulesChange(rules.map(r => r.id === id ? { ...r, weight } : r))
  }

  const deleteRule = (id) => {
    onRulesChange(rules.filter(r => r.id !== id))
  }

  const editRule = (id, patch) => {
    onRulesChange(rules.map(r => r.id === id ? { ...r, ...patch } : r))
  }

  const addRule = (newRule) => {
    onRulesChange([...rules, newRule])
    setAdding(false)
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
        {adding && (
          <AddRuleForm onAdd={addRule} onCancel={() => setAdding(false)} />
        )}
        {rules.map(rule => (
          <RuleCard
            key={rule.id}
            rule={rule}
            onToggle={toggle}
            onWeightChange={setWeight}
            onDelete={deleteRule}
            onEdit={editRule}
            disabled={disabled}
          />
        ))}
        {!disabled && !adding && (
          <button
            onClick={() => setAdding(true)}
            style={{
              width: '100%',
              padding: '8px 0',
              borderRadius: 8,
              border: '1px dashed #2d3152',
              background: 'transparent',
              color: '#475569',
              fontSize: 12,
              cursor: 'pointer',
              marginTop: 4,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.target.style.color = '#818cf8'; e.target.style.borderColor = '#6366f1' }}
            onMouseLeave={e => { e.target.style.color = '#475569'; e.target.style.borderColor = '#2d3152' }}
          >
            + Add custom rule
          </button>
        )}
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
