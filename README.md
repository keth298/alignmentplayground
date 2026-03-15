# Alignment Playground

An interactive debugger for exploring how alignment policies affect large language model behavior. Define constitution-style rules, run a benchmark suite through a target model, score outputs with evaluator models, and watch the tradeoffs update in real time.

---

## What it does

Instead of treating alignment as a single number, Alignment Playground makes it **visible, measurable, and interactive**. You can:

- Edit alignment rules (name, description, category, weight) in the left panel
- Run a live (fast) or full benchmark through a target LLM
- See safety, helpfulness, refusal rate, false refusal rate, and policy consistency update live in the right-side score panel
- Compare two rule configurations side by side
- Inspect individual prompt/response pairs to understand failures

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15.1.3, React 19, TypeScript |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | FastAPI, Python 3.12, Uvicorn |
| Storage | Firebase / Firestore |
| Cache | In-memory (process-local, TTL-based) |
| Target model | Groq — `llama-3.3-70b-versatile` (configurable) |
| Judge model | Gemini — `gemini-2.5-flash` (configurable) |
| Prompt generation | Groq — `llama-3.1-8b-instant` |
| Containerization | Docker Compose |

---

## Project structure

```
alignmentplayground/
├── .env                        # API keys and config (see setup)
├── .env.example
├── package.json                # Root workspace (npm workspaces)
├── docker-compose.yml
│
├── frontend/                   # Next.js app
│   ├── package.json
│   ├── next.config.ts          # Proxies /api/* to backend
│   ├── tsconfig.json
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx                    # Main playground (/)
│       │   ├── compare/page.tsx            # Run comparison (/compare)
│       │   └── runs/[runId]/page.tsx       # Run detail (/runs/:id)
│       ├── components/
│       │   ├── rules/                      # ConstitutionPanel, RuleEditor, RuleToggleList, WeightSlider
│       │   ├── dashboard/                  # MetricsCards, TradeoffChart, CategoryBreakdown, RefusalRateChart, DeltaSummary
│       │   ├── live-score-panel/           # LiveScorePanel, MetricGauge, DeltaBadge, RadarSummaryChart, PendingOverlay, BaselineFreezeButton
│       │   ├── outputs/                    # OutputsTable, FailureGallery, PromptResponseCard, OutputComparison
│       │   ├── benchmark/                  # BenchmarkSelector, PromptTable, PromptCategoryLegend
│       │   ├── layout/                     # ThreeColumnLayout, Header, Sidebar, MainPanel, RunHistory
│       │   ├── setup/                      # SetupScreen
│       │   └── common/                     # LoadingSpinner, EmptyState, ErrorBanner, Badge
│       ├── lib/
│       │   ├── api.ts                      # All backend API calls
│       │   ├── types.ts                    # Shared TypeScript types
│       │   └── constants.ts
│       └── styles/globals.css
│
├── backend/                    # FastAPI app
│   ├── requirements.txt
│   ├── pyproject.toml
│   ├── firebase-credentials.json
│   └── app/
│       ├── main.py             # App entrypoint, CORS, Firebase init
│       ├── config.py           # Pydantic settings (reads .env)
│       ├── api/
│       │   ├── routes/         # health, runs, rules, benchmarks, compare, prompts, scoring
│       │   └── schemas/        # Pydantic request/response models
│       ├── core/
│       │   ├── run_orchestrator.py
│       │   ├── prompt_builder.py
│       │   ├── benchmark_selector.py
│       │   ├── metrics_aggregator.py
│       │   ├── prompt_generator.py
│       │   ├── edge_case_generator.py
│       │   └── cache_keys.py
│       ├── models/
│       │   ├── target_model_client.py
│       │   ├── provider_router.py
│       │   ├── open_source_judge_client.py
│       │   ├── gemini_client.py
│       │   ├── claude_client.py
│       │   └── tools.py
│       ├── scoring/
│       │   ├── judge_runner.py
│       │   ├── rubrics.py
│       │   ├── score_parser.py
│       │   ├── score_normalizer.py
│       │   ├── aggregate_scores.py
│       │   └── tool_call_scorer.py
│       ├── benchmarks/
│       │   ├── loaders.py
│       │   └── prompts/
│       │       ├── live_subset.json        # ~30-50 prompts for fast runs
│       │       ├── full_suite.json         # ~150-500 prompts
│       │       └── categories/             # adversarial, borderline, false_refusal, rule_conflict, safe, unsafe
│       ├── storage/
│       │   ├── database.py                 # Firebase Admin SDK + Firestore client
│       │   ├── cache.py                    # In-memory TTL cache (no Redis)
│       │   ├── models.py
│       │   └── repositories/              # run, prompt, score, ruleset
│       ├── workers/
│       │   ├── task_queue.py
│       │   ├── run_worker.py
│       │   └── scoring_worker.py
│       └── utils/                          # hashing, logging, timing
│
├── packages/
│   ├── shared-types/src/index.ts
│   └── ui/src/index.ts
│
├── data/
│   ├── seed_rules/
│   │   ├── default_rules.json
│   │   └── demo_rules.json
│   ├── demo_runs/sample_run.json
│   └── exports/
│
└── scripts/
    ├── seed_benchmarks.py
    ├── preload_cache.py
    ├── run_full_eval.py
    └── export_report.py
```

---

## API endpoints

All routes are prefixed with `/api`.

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/rules/default` | Default rule templates |
| POST | `/api/rules/{rule_id}/edge-cases` | Generate edge cases for a rule |
| GET | `/api/rules/{rule_id}/edge-cases` | Fetch previously generated edge cases |
| GET | `/api/benchmarks/live` | Live benchmark subset |
| GET | `/api/benchmarks/full` | Full benchmark suite |
| GET | `/api/benchmarks/categories` | Benchmark category list |
| GET | `/api/benchmarks/stats` | Prompt counts per mode and category |
| POST | `/api/runs` | Create and start a run |
| GET | `/api/runs` | List all runs |
| GET | `/api/runs/{run_id}` | Run details |
| GET | `/api/runs/{run_id}/outputs` | Prompt/response pairs for a run |
| GET | `/api/runs/{run_id}/baseline-outputs` | Baseline model outputs |
| GET | `/api/runs/{run_id}/stream` | SSE stream of live metric updates |
| POST | `/api/prompts/generate` | Generate prompts from a description |
| POST | `/api/compare` | Compare two runs |
| POST | `/api/scoring/preview` | Fast re-score using cached outputs (no model calls) |
| POST | `/api/scoring/full` | Full re-evaluation for a run |

---

## Setup

### Requirements

- Docker and Docker Compose, **or** Python 3.12+ and Node 22+
- A [Groq API key](https://console.groq.com) (required)
- A [Google Gemini API key](https://aistudio.google.com) (required for Gemini judge)
- A Firebase project with Firestore enabled (required for storage)

### 1. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...
TARGET_MODEL=llama-3.3-70b-versatile
JUDGE_MODEL=gemini-2.5-flash
FIREBASE_CREDENTIALS_PATH=firebase-credentials.json
FIREBASE_PROJECT_ID=your-project-id
```

Place your Firebase service account JSON at `backend/firebase-credentials.json`.

### 2. Run with Docker (recommended)

```bash
docker-compose up
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API docs | http://localhost:8000/docs |

### 3. Run manually

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev   # http://localhost:3000
```

---

## Configuration reference

All backend settings are read from `.env` via `app/config.py`:

| Variable | Default | Description |
|---|---|---|
| `GROQ_API_KEY` | — | Groq API key (required) |
| `GEMINI_API_KEY` | — | Google Gemini API key |
| `FIREBASE_CREDENTIALS_PATH` | `firebase-credentials.json` | Path to Firebase service account JSON |
| `FIREBASE_PROJECT_ID` | — | Firebase project ID |
| `TARGET_MODEL` | `llama-3.3-70b-versatile` | LLM to evaluate |
| `JUDGE_MODEL` | `gemini-2.5-flash` | Model used to score outputs |
| `PROMPT_GENERATOR_MODEL` | `llama-3.1-8b-instant` | Model used to generate edge-case prompts |
| `CONCURRENCY` | `3` | Max parallel model API calls |
| `CACHE_TTL` | `86400` | In-memory cache TTL in seconds (24 hours) |

---

## Python dependencies

```
fastapi==0.115.5
uvicorn[standard]==0.32.1
groq==0.13.0
firebase-admin==6.5.0
google-cloud-firestore==2.19.0
google-generativeai==0.8.3
pydantic-settings==2.6.1
python-dotenv==1.0.1
httpx==0.28.1
```

---

## Benchmark categories

| Category | Description |
|---|---|
| `safe` | Benign prompts that should be answered normally |
| `unsafe` | Harmful prompts that should be refused |
| `borderline` | Ambiguous or context-dependent prompts |
| `false_refusal` | Benign prompts likely to trigger over-refusal |
| `adversarial` | Same harmful intent with alternate phrasing |
| `rule_conflict` | Cases where multiple active rules compete |

---

## Scoring metrics

Each run output is scored across five dimensions:

| Metric | Description |
|---|---|
| **Safety** | Did the response avoid harmful assistance? (0–100) |
| **Helpfulness** | Did the response address the user's request? (0–100) |
| **Refusal correctness** | Was the refusal decision appropriate? |
| **Policy consistency** | Did the response follow the active rule set? |
| **Tool call accuracy** | Were any tool calls correct and well-formed? |

The Live Score Panel on the right always shows these metrics with delta badges vs your frozen baseline.
