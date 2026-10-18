# Adding ML / DL prediction models to ChillFin

## Where things stand

The app now has a **statistical baseline**, `lib/insights.ts`, shown as *Smart Insights* on the Overview and fed to the AI advisor:

| Prediction | Method | Needs |
|---|---|---|
| Month-end spend | This month's pace blended with the user's typical month, weighted by how far into the month it is | 1+ day of this month |
| Next month's spend | Holt's damped-trend exponential smoothing, ~80% range from one-step-ahead errors | 2+ tracked months |
| Unusual categories | Projected category spend vs. the user's own median | 2+ tracked months |

**Why start with a baseline instead of deep learning?** One student has roughly 3–12 monthly data points. That's far too little to train a neural network on, and a per-user model that small would just memorize noise. What *can* work later is a **global** model trained across all users. Any model you add should be judged on one test: **does it beat the baseline in a backtest?** If it doesn't, keep the baseline. The data-size thresholds below are rough rules of thumb from common practice, not hard requirements.

## Feature ideas, ranked by value and effort

| # | Feature | Why it helps students | v1 (now) | v2 (more data) |
|---|---|---|---|---|
| 1 | **Auto-categorize transactions** from the description ("Zomato", "auto to college", "chai") | Faster logging means people keep logging, and every other model needs that data | Zero-shot with the LLM you already have: send the description and the category list, get one label back | Text classifier trained on users' own (description → category) pairs, which the app already collects. TF-IDF + logistic regression, or a small multilingual embedding model to handle Hinglish. Export to ONNX. |
| 2 | **Goal success probability** ("62% chance you hit ₹60k by March") | Turns a progress bar into a plan | Monte Carlo over the user's monthly net savings (bootstrap past months) | Adds the spend forecast from #4 as an input |
| 3 | **Overspend early warning** (P(exceed budget) by day N) | Warns students while there's still time to adjust | The month-end projection vs. budget (already shipped) | Logistic regression or gradient boosting on features like day-of-month, spend so far, last 3 months, recent income |
| 4 | **Per-category spend forecast** | More precise budgets, better "unusual" alerts | Baseline (shipped) | **Global LightGBM** with lag features (1–3 months), month-of-year, and Indian calendar flags (Diwali, exams, semester start); one model across all users |
| 5 | **Portfolio ranges instead of one line** | Showing one constant-return line overstates certainty | Monte Carlo with bootstrapped historical monthly index returns (check the data licence) | Not ML, but much more honest than today's single curve |
| 6 | **Deep learning forecasting** (N-BEATS, Temporal Fusion Transformer, LSTM) | Learns patterns shared across many users | Not yet | Only once there are thousands of users with 12+ months each, **and** it beats #4 in backtests |

## Architecture

```
Convex (live data)
   │  nightly: scheduled internal action exports de-identified feature rows
   ▼
Training (Python: pandas, scikit-learn / LightGBM, PyTorch for DL)
   runs in GitHub Actions (cron) or Colab/Modal for heavier jobs
   │  outputs: model.onnx + metrics.json (+ model version)
   ▼
Model store: Convex file storage or Vercel Blob (versioned)
   ▼
Inference (pick one):
   A. ONNX in a Convex Node action ("use node" + onnxruntime-node)  ← start here
   B. Python service (FastAPI on Modal / Render / Cloud Run) for PyTorch models
   C. In the browser (onnxruntime-web) for tiny models; data never leaves the device
   ▼
Convex table `predictions` {firebase_uid, kind, value, low, high, model_version, created_at}
   written by a nightly cron (convex/crons.ts); the UI reads it reactively
```

Notes on the options:
- **A** keeps everything on infrastructure you already have. Gradient-boosted and linear models export to ONNX cleanly (`skl2onnx`, `onnxmltools`).
- **B** is for PyTorch-sized models. PyTorch is too large for typical serverless bundles, so Vercel Python functions are a poor fit (check Vercel's current size limits).
- Keep `lib/insights.ts` as the **fallback**: whenever a user has no prediction, or the model is unavailable, serve the baseline.

### Sketch: serving a trained model from Convex (option A)

Illustrative only. Not part of this repo yet.

```ts
// convex/forecastModel.ts
'use node'
import { internalAction } from './_generated/server'
import { internal } from './_generated/api'
import * as ort from 'onnxruntime-node'

export const runNightly = internalAction({
  args: {},
  handler: async (ctx) => {
    const modelBytes = await (await ctx.storage.get(process.env.FORECAST_MODEL_STORAGE_ID!))!.arrayBuffer()
    const session = await ort.InferenceSession.create(new Uint8Array(modelBytes))
    const rows = await ctx.runQuery(internal.features.forAllUsers, {}) // [{uid, features: number[]}]
    for (const r of rows) {
      const out = await session.run({ input: new ort.Tensor('float32', Float32Array.from(r.features), [1, r.features.length]) })
      await ctx.runMutation(internal.predictions.upsert, { uid: r.uid, kind: 'next_month_spend', value: Number(out.output.data[0]) })
    }
  },
})
```

### Sketch: training with an honest backtest

```python
# ml/train_forecast.py: one global model across users; rolling-origin evaluation
import lightgbm as lgb, pandas as pd
df = pd.read_parquet("features.parquet")   # user_hash, month, category, spend, lag1..lag3, month_of_year, festival_flag, ...
folds = sorted(df.month.unique())[-6:]     # evaluate on each of the last 6 months, training only on the past
for m in folds:
    train, test = df[df.month < m], df[df.month == m]
    model = lgb.LGBMRegressor(objective="l1", n_estimators=400).fit(train[FEATURES], train.spend)
    mae_model = (model.predict(test[FEATURES]) - test.spend).abs().mean()
    mae_baseline = (test.baseline_forecast - test.spend).abs().mean()   # from lib/insights.ts logic
    print(m, mae_model, mae_baseline)  # ship only if the model wins consistently
```

## Evaluation and monitoring

- **Split by time, never randomly.** Always predict the future from the past (rolling-origin backtests).
- Report **MAE** in rupees. Many students log ₹0 in some categories, which makes MAPE unstable. Check whether your ~80% ranges contain the actual value about 80% of the time.
- Compare against the baseline per user segment, both new users (few months) and long-time users.
- Re-check monthly. Spending drifts with exams, festivals and inflation. Store `model_version` with every prediction so you can trace problems.

## Data, privacy and consent

This section is not legal advice; check with a professional.

- India's **DPDP Act 2023** applies to personal financial data. The relevant ideas are consent for the specific purpose (training models is a new purpose, so update the Terms and ask for consent), data minimisation and retention limits. Your audience starts at 17, and the Act treats under-18s as children, requiring verifiable parental consent. The DPDP Rules are being phased in, so confirm the current obligations.
- Train on **de-identified** data: drop names and emails, replace `firebase_uid` with a salted hash, and keep descriptions only for the categorization model.
- Offer an **opt-out** from model training, and never send raw transaction lists to third-party APIs unless your Terms say so.

## Suggested sequence

1. **Now:** baseline shipped. Next, add LLM auto-categorization (#1) and the Monte Carlo goal probability (#2). No training needed.
2. **Once you have a few hundred active users with 3+ months each:** a global LightGBM forecast (#4) and the overspend classifier (#3), served through ONNX (option A), with the baseline as fallback.
3. **Thousands of users with 12+ months:** try DL forecasting (#6), and train the description classifier on your own labelled data. Keep whichever model wins the backtest.
