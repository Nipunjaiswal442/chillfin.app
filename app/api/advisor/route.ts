import { NextRequest, NextResponse } from 'next/server'

const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions'
const SYSTEM_PROMPT = `You are ChillFin AI, a friendly and knowledgeable financial advisor built specifically for Indian college students aged 17–24.

Your core principles:
- Speak in simple, friendly language (mix of English, avoid jargon)
- All investment suggestions must be SEBI-compliant and educational
- Always add a disclaimer when giving investment advice
- Focus on practical, student-relevant advice (pocket money, SIPs, EMI, goals)
- Give specific numbers and examples using Indian Rupees (₹)
- Be encouraging but realistic
- Keep responses concise and actionable

Topics you cover:
- Pocket money budgeting (50/30/20 rule)
- Expense tracking and saving habits
- Goal-based saving (laptop, trip, gadgets)
- EMI affordability and smart borrowing
- Beginner investments: SIP, digital gold, liquid funds, PPF, FD
- SEBI-compliant mutual fund basics
- Building good financial habits before first paycheck

Always end investment advice with: "⚠ This is educational guidance only. Please consult a SEBI-registered advisor for personalised investment advice."

Do NOT:
- Recommend specific stocks to buy/sell
- Give guaranteed return figures
- Act as a licensed financial advisor
- Encourage high-risk trading`

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.NVIDIA_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
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
    return NextResponse.json({ error: 'AI service error' }, { status: 502 })
  }

  // Stream the response back to the client
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
