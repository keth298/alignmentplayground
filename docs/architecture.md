# Architecture

## Overview

Alignment Playground uses a three-tier architecture:

1. **Frontend** — Next.js app with a persistent Live Score Panel sidebar
2. **Backend** — FastAPI Python service that orchestrates model calls, scoring, and caching
3. **Storage** — Postgres for persistent data, Redis for caching model/judge outputs

## Request Flow

```
User changes rules in UI
  -> debounced POST /scoring/preview (300ms)
  -> Backend reweights cached per-output scores
  -> Backend streams metrics via SSE GET /runs/live-stream
  -> Live Score Panel animates to new values
```

## Key Design Decisions

- Live mode never triggers new model calls if cached outputs exist
- All prompt+ruleset+model combinations are hashed for cache lookup
- Judge outputs are structured JSON for stable parsing
- Frontend uses AbortController to cancel in-flight preview requests on new changes
