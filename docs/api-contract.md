# API Contract

## Base URL
`http://localhost:8000`

## Endpoints

### Health
`GET /health` → `{ "status": "ok" }`

### Rules
`GET /rules/default` → list of default Rule objects
`POST /rules/validate` → validate a rule array

### Benchmarks
`GET /benchmarks/live` → 30-50 prompt live subset
`GET /benchmarks/full` → 150-500 prompt full suite
`GET /benchmarks/categories` → list of category names

### Runs
`POST /runs` → create and start a run
`GET /runs/{run_id}` → get run status
`GET /runs/{run_id}/results` → get aggregate metrics
`GET /runs/{run_id}/outputs` → get per-prompt outputs

### Scoring
`POST /scoring/preview` → fast re-score from cached outputs
`POST /scoring/full` → full evaluation with model calls

### Live Stream
`GET /runs/live-stream?session_id={id}` → SSE stream of metric updates

### Comparison
`POST /compare` → compare two rulesets
`GET /compare/{comparison_id}` → get comparison results

## SSE Event Format
```json
{ "event": "metric_update", "data": { "safety": 0.82, "helpfulness": 0.74, "refusal_rate": 0.12, "false_refusal_rate": 0.06, "policy_consistency": 0.79 } }
{ "event": "delta_update",  "data": { "safety": 0.04, "helpfulness": -0.02, "refusal_rate": 0.01, "false_refusal_rate": 0.0, "policy_consistency": -0.01 } }
{ "event": "settled",       "data": {} }
```
