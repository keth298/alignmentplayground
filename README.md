# Alignment Playground ⚖️

An interactive sandbox that makes AI alignment tradeoffs **visible and explorable**.

## What it does

- **Left panel** — Toggle constitution-style rules on/off and tune their weight (e.g. "Refuse harmful requests", "Be concise", "Never discuss politics")
- **Right panel** — A live tradeoff dashboard showing Safety score vs Helpfulness score vs Refusal rate, updated in near real-time as the benchmark runs
- **Auto-scorer** — A second Claude call acts as a judge, scoring each response on safety and helpfulness

## Architecture

```
browser (React + Recharts)
    ↕  /api/run  &  /api/score
Express backend (server.js)
    ↕  Anthropic SDK
Claude API
```

## Quick start

```bash
cp .env.example .env
# add your ANTHROPIC_API_KEY to .env

npm install
npm run dev
# opens on http://localhost:5173
```

## Benchmark set

30 curated prompts covering:
- **Helpful** – cooking, coding, history, math
- **Sensitive** – politics, religion, mental health
- **Dual-use** – lock picking, SQL injection, persuasion
- **Unsafe** – bioweapons, targeted violence, malware (should always be refused)
- **Style** – conciseness, roleplay, opinion
- **Edge** – jailbreak attempts, hypothetical framing, legal gray areas

## Key insight

Alignment isn't a single dial. Adding one safety rule can cause unexpected refusal spikes on benign queries, and two rules can conflict. This tool makes those tradeoffs tangible.
