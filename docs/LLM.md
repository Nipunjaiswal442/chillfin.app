# AI Advisor: reactivating and configuring the LLM

The advisor (`app/api/advisor/route.ts`) works with **any OpenAI-compatible Chat Completions API**. It defaults to NVIDIA NIM, which is what the app used before, so reactivating it in the new environment is mostly a matter of setting environment variables.

## Why it likely went dark in a new environment

The old route returned **"Unauthorized: Please sign in"** for *any* failure inside Firebase Admin token verification. That included `FIREBASE_ADMIN_SERVICE_ACCOUNT` being missing or malformed. So on a fresh deployment the advisor could claim you were signed out when the real problem was a missing server secret. (I read this from the old code, not from logs.)

The new route no longer needs that secret. Convex verifies the sign-in, and each failure mode now has its own message (see [Troubleshooting](#troubleshooting)).

Other possible causes I couldn't check from here: the NVIDIA key may have expired or been revoked, or the model `qwen/qwen3.5-122b-a10b` may have been retired. The build environment couldn't reach `integrate.api.nvidia.com`, so step 2 below is how you check.

## Reactivate in 5 steps

1. **Get a key.** Go to https://build.nvidia.com, sign in, open any model and choose *Get API Key*. Keys start with `nvapi-`. NVIDIA's free-credit terms change over time, so check them on that page.
2. **Check the key and model from your terminal:**
   ```bash
   export LLM_API_KEY=nvapi-...
   # Is the model still served?
   curl -s https://integrate.api.nvidia.com/v1/models -H "Authorization: Bearer $LLM_API_KEY" \
     | grep -o '"id":"[^"]*qwen[^"]*"'
   # Does a completion work?
   curl -s https://integrate.api.nvidia.com/v1/chat/completions \
     -H "Authorization: Bearer $LLM_API_KEY" -H "Content-Type: application/json" \
     -d '{"model":"qwen/qwen3.5-122b-a10b","messages":[{"role":"user","content":"Say hi"}],"max_tokens":20}'
   ```
   If the model isn't listed or returns 404, pick another ID from the list and use it as `LLM_MODEL`.
3. **Vercel:** add `LLM_API_KEY` under *Settings → Environment Variables* (Production + Preview), plus `LLM_MODEL` if you changed it. **Redeploy**, because env changes only apply to new deployments.
4. **Convex:** make sure `FIREBASE_PROJECT_ID` is set on the deployment (`npx convex env set FIREBASE_PROJECT_ID <id> --prod`). The advisor authenticates through Convex.
5. **Test:** sign in, open **AI Advisor** and ask "How should I split my pocket money?" The answer should reference your actual income and spending.

**Locally:** put `LLM_API_KEY=...` in `.env.local`, then run `npx convex dev` and `npm run dev`.

## Configuration

| Variable | Where | Default | Purpose |
|---|---|---|---|
| `LLM_API_KEY` | Vercel / `.env.local` | none | Provider API key (required). `NVIDIA_API_KEY` is still accepted as a fallback. |
| `LLM_BASE_URL` | Vercel / `.env.local` | `https://integrate.api.nvidia.com/v1` | Any OpenAI-compatible base URL |
| `LLM_MODEL` | Vercel / `.env.local` | `qwen/qwen3.5-122b-a10b` | Model ID from the provider's `/v1/models` |
| `LLM_MAX_TOKENS` | Vercel / `.env.local` | `2048` | Max tokens per answer (was 8192) |
| `ADVISOR_HOURLY_LIMIT` | **Convex** (`npx convex env set`) | `30` | Questions per user per hour |

`chat_template_kwargs: { enable_thinking: false }` is sent **only** to NVIDIA. Other providers reject unknown fields.

## Switching provider

Set `LLM_BASE_URL`, `LLM_API_KEY` and `LLM_MODEL`. These providers expose OpenAI-compatible endpoints:

- OpenAI: `https://api.openai.com/v1`
- Groq: `https://api.groq.com/openai/v1`
- OpenRouter: `https://openrouter.ai/api/v1` (one key, many models)
- Together AI: `https://api.together.xyz/v1`
- Ollama, for local development only: `http://localhost:11434/v1`. A Vercel deployment can't reach your laptop.

Pick the model ID from the provider's own model list. A provider with only a non-OpenAI-compatible API would need a small adapter in `route.ts`. The conversation already starts with a user turn and has no client-supplied system messages, which strict providers require.

## What changed for safety and cost

- The **student's financial context is built on the server** from Convex (`convex/advisor.ts`): income, this month's plan and spending by category, goals, and the Smart Insights forecasts. Previously the browser sent free text that went straight into the system prompt.
- Messages the client sends with `role: "system"` are dropped. History is capped at 20 messages × 4,000 characters.
- A **per-user hourly quota** is stored in Convex.
- The upstream request is **cancelled when the student leaves the page**, so you stop paying for tokens nobody reads.

## Troubleshooting

| Message in chat | Cause | Fix |
|---|---|---|
| "Deployment Error: `LLM_API_KEY` … is missing" | Env var not set, or no redeploy since setting it | Step 3 |
| "Unauthorized: I couldn't verify your session" | `FIREBASE_PROJECT_ID` missing or wrong on Convex, or an expired session | Step 4, then sign out and back in. Vercel logs show `Advisor auth/context failed` with the details. |
| "The AI provider rejected the API key" | 401/403 from the provider | New key, step 1 |
| "Model `…` was not found" | Model retired or renamed | Set `LLM_MODEL`, step 2 |
| "The AI service is busy right now" | 429 from the provider (rate limit or credits used up) | Wait, or check your provider quota |
| "You've reached the hourly AI Advisor limit" | Per-user quota | Raise `ADVISOR_HOURLY_LIMIT` on Convex |
| Answer stops mid-sentence | Hit `LLM_MAX_TOKENS` or the function's 60 s `maxDuration` | Lower `LLM_MAX_TOKENS`, or raise `maxDuration` in `route.ts` within your Vercel plan's limit |

Logs: Vercel → Project → *Logs*, filtered to `/api/advisor`. Auth and quota errors also appear in Convex → *Logs*.

## Privacy note

Each question now sends a short **summary of the student's own finances** to the LLM provider: income, spending by category, goal names and amounts, and forecasts. The login Terms (clause 3) say AI conversations may be processed by NVIDIA. If you switch provider, update that clause. This isn't legal advice; see the DPDP note in [AUDIT.md](./AUDIT.md).
