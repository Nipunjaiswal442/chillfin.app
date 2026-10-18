import { NextRequest } from 'next/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'

// Node runtime + a generous limit so long answers can finish streaming on Vercel
export const runtime = 'nodejs'
export const maxDuration = 60

// ─── LLM provider (any OpenAI-compatible Chat Completions API) ───────────────
// Defaults to NVIDIA NIM. See docs/LLM.md to switch provider or model.
const LLM_BASE_URL = (process.env.LLM_BASE_URL || 'https://integrate.api.nvidia.com/v1').replace(/\/+$/, '')
const LLM_MODEL = process.env.LLM_MODEL || 'qwen/qwen3.5-122b-a10b'
const LLM_MAX_TOKENS = Number(process.env.LLM_MAX_TOKENS || 2048)
const IS_NVIDIA = LLM_BASE_URL.includes('integrate.api.nvidia.com')

const MAX_MESSAGES = 20
const MAX_MESSAGE_CHARS = 4000

const SYSTEM_PROMPT = `You are ChillFin AI, a highly intelligent, empathetic, and friendly financial advisor built specifically for Indian college students aged 17–24.

Your core principles:
- Speak in simple, friendly, and highly encouraging language (mix of English, avoid complex jargon).
- Treat the student's financial questions with respect, offering structured step-by-step guidance.
- All investment suggestions MUST be SEBI-compliant and purely educational.
- Always add a disclaimer when discussing specific asset classes.
- Focus on practical, student-relevant advice (pocket money, SIPs, EMIs, UPI transactions, goal-saving).
- Give specific mathematical examples using Indian Rupees (₹).
- Keep responses concise, visually structured (using bullet points), and highly actionable.

Topics you cover:
- Pocket money budgeting frameworks (50/30/20 rule, envelope method).
- Expense tracking and building frugality habits seamlessly.
- Goal-based saving mechanisms (laptops, trips, courses, emergency funds).
- EMI affordability calculation and the dangers of high-interest debt traps.
- Beginner investments: SIPs in Index Funds, Digital Gold, Liquid Funds, PPF, FDs.
- Building a rock-solid credit foundation before landing the first job.

Always end discussions about market assets with: "⚠ This is educational guidance only. Please consult a SEBI-registered advisor for personalised investment advice."

Do NOT:
- Recommend specifically named single-company stocks to buy/sell.
- Promise or guarantee percentage return figures.
- Act as a licensed, legally binding financial fiduciary manager.
- Encourage high-risk derivatives, options, or speculative trading.`

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
}

const createSSEMessage = (content: string) => {
  return new Response(
    `data: ${JSON.stringify({
      choices: [{ delta: { content } }]
    })}\n\ndata: [DONE]\n\n`,
    { headers: SSE_HEADERS }
  )
}

/** Keeps only user/assistant turns (no client-supplied system prompts), trimmed and capped. */
function sanitizeMessages(input: unknown): Message[] | null {
  if (!Array.isArray(input)) return null
  const messages = input
    .filter((m): m is Message =>
      !!m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim() !== '')
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }))
    .slice(-MAX_MESSAGES)
  // Many providers require the first turn to be the user's (this drops the UI greeting)
  while (messages.length > 0 && messages[0].role === 'assistant') messages.shift()
  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') return null
  return messages
}

/** Calendar date in India (the app's audience), used for "this month" context. */
function todayInIndia(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
}

function providerErrorMessage(status: number): string {
  if (status === 401 || status === 403) {
    return '⚠️ **AI Service Error:** The AI provider rejected the API key. Check `LLM_API_KEY` in your Vercel Environment Variables and redeploy.'
  }
  if (status === 404) {
    return `⚠️ **AI Service Error:** Model \`${LLM_MODEL}\` was not found. Set \`LLM_MODEL\` to a model your provider lists at \`/v1/models\`.`
  }
  if (status === 429) {
    return '⚠️ The AI service is busy right now. Please try again in a minute.'
  }
  return `⚠️ **AI Service Error:** The AI provider returned status ${status}. Please try again in a moment.`
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer /, '')
  if (!token) {
    return createSSEMessage('⚠️ **Unauthorized:** Please sign in to use the AI Advisor.')
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
  const apiKey = process.env.LLM_API_KEY || process.env.NVIDIA_API_KEY
  if (!convexUrl || !apiKey) {
    const missing = !convexUrl ? '`NEXT_PUBLIC_CONVEX_URL`' : '`LLM_API_KEY` (or `NVIDIA_API_KEY`)'
    return createSSEMessage(`⚠️ **Deployment Error:** Wait, my AI brain can't connect! ${missing} is missing in your Vercel Environment Variables. Add it in the Vercel Dashboard and trigger a redeploy!`)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return createSSEMessage('⚠️ Server Error: Got an invalid request format from the chat interface.')
  }
  const messages = sanitizeMessages((body as { messages?: unknown } | null)?.messages)
  if (!messages) {
    return createSSEMessage('⚠️ Please type a question first.')
  }

  // ─── Convex verifies the Firebase ID token, applies the hourly quota, and
  // returns the student's real numbers (the client can't inject "context") ──
  let chat
  try {
    const convex = new ConvexHttpClient(convexUrl)
    convex.setAuth(token)
    chat = await convex.mutation(api.advisor.beginChat, { today: todayInIndia() })
  } catch (err) {
    console.error('Advisor auth/context failed (check FIREBASE_PROJECT_ID on the Convex deployment):', err)
    return createSSEMessage('⚠️ **Unauthorized:** I couldn\'t verify your session. Please sign out and sign in again.')
  }
  if (!chat.allowed) {
    return createSSEMessage(`⏳ You've reached the hourly AI Advisor limit. Please try again in about ${chat.retryAfterMinutes} minute${chat.retryAfterMinutes === 1 ? '' : 's'}.`)
  }

  const payload: Record<string, unknown> = {
    model: LLM_MODEL,
    messages: [
      { role: 'system', content: `${SYSTEM_PROMPT}\n\nThe student's current finances (from their ChillFin data):\n${chat.context}` },
      ...messages,
    ],
    max_tokens: LLM_MAX_TOKENS,
    temperature: 0.6,
    top_p: 0.95,
    stream: true,
  }
  // NVIDIA NIM option to skip Qwen's reasoning tokens; other providers reject unknown fields
  if (IS_NVIDIA) payload.chat_template_kwargs = { enable_thinking: false }

  let upstream: Response
  try {
    upstream = await fetch(`${LLM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(payload),
      // Stop generating (and paying for tokens) if the student leaves the page
      signal: request.signal,
    })
  } catch (err) {
    console.error('LLM API unreachable:', err)
    return createSSEMessage('⚠️ **AI Service Error:** Couldn\'t reach the AI provider. Please try again in a moment.')
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '')
    console.error(`LLM API error ${upstream.status}:`, detail.slice(0, 500))
    return createSSEMessage(providerErrorMessage(upstream.status))
  }

  // Pipe the provider's SSE stream straight through to the browser
  return new Response(upstream.body, { headers: SSE_HEADERS })
}
