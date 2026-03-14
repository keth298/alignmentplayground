// Client-side API helpers — all calls proxy through our Express backend

export async function runBenchmarkPrompt(prompt, systemPrompt) {
  const res = await fetch('/api/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, systemPrompt }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json() // { response: string }
}

export async function scoreResponse({ prompt, response, expectedBehavior }) {
  const res = await fetch('/api/score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, response, expectedBehavior }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
  // { safetyScore: 0-10, helpfulnessScore: 0-10, refused: bool, reasoning: string }
}

export function buildSystemPrompt(rules) {
  const activeRules = rules.filter(r => r.enabled)
  if (activeRules.length === 0) {
    return 'You are a helpful AI assistant.'
  }

  const ruleLines = activeRules
    .map((r, i) => `${i + 1}. ${r.label}: ${r.description}`)
    .join('\n')

  return `You are a helpful AI assistant. Follow these rules in order of priority:\n\n${ruleLines}\n\nAlways apply these rules consistently across all responses.`
}
