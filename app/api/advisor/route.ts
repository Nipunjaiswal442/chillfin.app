import { NextRequest } from 'next/server'

const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions'
const SYSTEM_PROMPT = `You are ChillFin AI, a highly intelligent, empathetic, and friendly financial advisor built specifically for Indian college students aged 17–24.

Your core principles:
- Speak in simple, friendly, and highly encouraging language (mix of English, avoid complex jargon).
- Treat the student's financial questions with respect, offering structured step-by-step guidance.
- All investment suggestions MUST be SEBI-compliant and purely educational.
- Always add a disclaimer when discussing specific asset classes.
- Focus on practical, student-relevant advice (pocket money, SIPs, EMIs, UP transactions, goal-saving).
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
  role: 'user' | 'assistant' | 'system'
  content: string
}

const createSSEMessage = (content: string) => {
  return new Response(
    `data: ${JSON.stringify({
      choices: [{ delta: { content } }]
    })}\n\ndata: [DONE]\n\n`,
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    }
  )
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.NVIDIA_API_KEY
  if (!apiKey) {
    return createSSEMessage("⚠️ **Deployment Error:** Wait, my AI brain can't connect! The `NVIDIA_API_KEY` is missing in your Netlify Environment Variables. Please add the API key in the Netlify Dashboard and trigger a redeploy!")
  }

  let body
  try {
    body = await request.json()
  } catch {
    return createSSEMessage("⚠️ Server Error: Got an invalid request format from the chat interface.")
  }

  const { messages, userContext } = body as { messages: Message[]; userContext?: string }

  const systemContent = userContext
    ? `${SYSTEM_PROMPT}\n\nUser context: ${userContext}`
    : SYSTEM_PROMPT

  const payload = {
    model: 'qwen/qwen3.5-122b-a10b',
    messages: [
      { role: 'system', content: systemContent },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    max_tokens: 8192,
    temperature: 0.6,
    top_p: 0.95,
    stream: true,
    chat_template_kwargs: { enable_thinking: false },
  }

  const nvidiaRes = await fetch(NVIDIA_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(payload),
  })

  if (!nvidiaRes.ok) {
    const err = await nvidiaRes.text()
    console.error('NVIDIA API error:', err)
    return createSSEMessage(`⚠️ **AI Service Error:** The NVIDIA API rejected the connection. Did you enter the full valid API key in Netlify? Status Code: ${nvidiaRes.status}`)
  }

  const stream = new ReadableStream({
    async start(controller) {
      const reader = nvidiaRes.body?.getReader()
      if (!reader) {
        controller.close()
        return
      }
      const decoder = new TextDecoder()
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          controller.enqueue(new TextEncoder().encode(chunk))
        }
      } finally {
        controller.close()
        reader.releaseLock()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}

