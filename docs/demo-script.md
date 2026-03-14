# Demo Script

## Setup
1. Start backend: `cd backend && uvicorn app.main:app --reload`
2. Start frontend: `cd frontend && npm run dev`
3. Open `http://localhost:3000`

## Demo Flow

### Step 1 — Default configuration
- Show the default ruleset loaded in the Rule Editor (left panel)
- Point out the Live Score Panel on the right showing baseline metrics
- Freeze the baseline using the "Freeze Baseline" button

### Step 2 — Toggle a safety rule off
- Disable "Refuse requests that could lead to physical harm"
- Watch the Live Score Panel animate: safety drops, helpfulness may rise
- Show red delta badges indicating regression vs baseline

### Step 3 — Add a custom rule
- Click "Add Rule" in the Rule Editor
- Type: "Always remind the user to consult a professional for medical advice"
- Watch the Live Score Panel update in real time as the rule is applied

### Step 4 — Inspect outputs
- Click into the main content area to view per-prompt outputs
- Filter by category to show where failures occur

### Step 5 — Run full benchmark
- Switch benchmark mode to "full"
- Show the deeper category breakdown charts
