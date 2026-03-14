import { useState, useCallback } from 'react'
import ConstitutionPanel from './components/ConstitutionPanel'
import TradeoffDashboard from './components/TradeoffDashboard'
import { DEFAULT_RULES, BENCHMARK_PROMPTS } from './data/benchmarks'
import { buildSystemPrompt, runBenchmarkPrompt, scoreResponse } from './api/claude'

const CONCURRENCY = 3 // run this many prompts in parallel

export default function App() {
  const [rules, setRules] = useState(DEFAULT_RULES)
  const [results, setResults] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  const systemPrompt = buildSystemPrompt(rules)

  const updateResult = useCallback((id, patch) => {
    setResults(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r))
  }, [])

  const runBenchmark = async () => {
    setIsRunning(true)
    setError(null)
    setProgress(0)

    // Initialise result rows so the table appears immediately
    const initial = BENCHMARK_PROMPTS.map(p => ({ ...p, safetyScore: undefined, helpfulnessScore: undefined, refused: undefined }))
    setResults(initial)

    const total = BENCHMARK_PROMPTS.length
    let completed = 0

    // Process prompts in batches of CONCURRENCY
    for (let i = 0; i < total; i += CONCURRENCY) {
      const batch = BENCHMARK_PROMPTS.slice(i, i + CONCURRENCY)
      await Promise.all(batch.map(async (bp) => {
        try {
          const { response } = await runBenchmarkPrompt(bp.prompt, systemPrompt)
          const scores = await scoreResponse({
            prompt: bp.prompt,
            response,
            expectedBehavior: bp.expectedBehavior,
          })
          updateResult(bp.id, {
            response,
            safetyScore: scores.safetyScore,
            helpfulnessScore: scores.helpfulnessScore,
            refused: scores.refused,
            reasoning: scores.reasoning,
          })
        } catch (err) {
          updateResult(bp.id, {
            safetyScore: 0,
            helpfulnessScore: 0,
            refused: false,
            error: err.message,
          })
        } finally {
          completed++
          setProgress(completed)
        }
      }))
    }

    setIsRunning(false)
  }

  const reset = () => {
    setResults([])
    setProgress(0)
    setError(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* ── Top bar ── */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: 52,
        background: '#0a0c14',
        borderBottom: '1px solid #1e2234',
        flexShrink: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>⚖️</span>
          <div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.02em' }}>
              Alignment Playground
            </span>
            <span style={{
              marginLeft: 10,
              fontSize: 10,
              color: '#475569',
              background: '#1e2234',
              padding: '2px 7px',
              borderRadius: 4,
              fontWeight: 500,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>
              MVP
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {error && (
            <span style={{ fontSize: 12, color: '#ef4444', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              ⚠ {error}
            </span>
          )}
          {results.length > 0 && !isRunning && (
            <button
              onClick={reset}
              style={{
                padding: '7px 14px',
                borderRadius: 7,
                border: '1px solid #2d3152',
                background: 'transparent',
                color: '#64748b',
                fontSize: 12,
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Reset
            </button>
          )}
          <button
            onClick={runBenchmark}
            disabled={isRunning}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              background: isRunning
                ? '#374151'
                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: isRunning ? '#6b7280' : '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: isRunning ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: isRunning ? 'none' : '0 0 20px #6366f140',
            }}
          >
            {isRunning ? (
              <>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>◌</span>
                Running…
              </>
            ) : (
              <>▶ Run Benchmark</>
            )}
          </button>
        </div>
      </header>

      {/* ── Body: left panel + right dashboard ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: Constitution */}
        <div style={{ width: 320, flexShrink: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <ConstitutionPanel
            rules={rules}
            onRulesChange={setRules}
            systemPrompt={systemPrompt}
            disabled={isRunning}
          />
        </div>

        {/* Right: Dashboard */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <TradeoffDashboard
            results={results}
            isRunning={isRunning}
            progress={progress}
            total={BENCHMARK_PROMPTS.length}
          />
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2d3152; border-radius: 3px; }
      `}</style>
    </div>
  )
}
