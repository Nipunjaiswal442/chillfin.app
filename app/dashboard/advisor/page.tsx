'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useUser } from '@/contexts/UserContext'
import { formatCurrency } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { Send, Bot, RefreshCw } from 'lucide-react'
import { auth } from '@/lib/firebase'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED_QUESTIONS = [
  'How should I split my ₹5000 pocket money?',
  'Explain SIP for a complete beginner',
  'Should I take a ₹20,000 EMI for a laptop?',
  'What is the 50/30/20 rule?',
  'How do I start investing with ₹100?',
  'What is digital gold vs physical gold?',
]

export default function AdvisorPage() {
  const { user } = useAuth()
  const { profile } = useUser()
  const monthlyIncome = Number(profile?.monthly_pocket_money ?? 0)

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Namaste! 👋 I\'m ChillFin AI — your personal financial advisor built for Indian college students.\n\nI can help you with budgeting, EMI decisions, investment basics, and more. All advice is educational and SEBI-compliant.\n\nWhat\'s on your mind?',
    },
  ])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || streaming) return

    const userMsg: Message = { role: 'user', content }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setStreaming(true)

    // Add empty assistant message for streaming
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    try {
      const userContext = monthlyIncome > 0
        ? `The student's monthly pocket money is ${formatCurrency(monthlyIncome)}.`
        : ''

      // Get fresh ID token for server-side auth verification
      const idToken = auth ? await auth.currentUser?.getIdToken() : null

      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          messages: newMessages,
          userContext,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to get response')
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim()
              if (data === '[DONE]') break
              try {
                const parsed = JSON.parse(data)
                const delta = parsed.choices?.[0]?.delta?.content ?? ''
                // Filter out thinking tags
                if (delta) {
                  fullContent += delta
                  // Remove <think>...</think> blocks from display
                  const displayContent = fullContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
                  setMessages((prev) => [
                    ...prev.slice(0, -1),
                    { role: 'assistant', content: displayContent },
                  ])
                }
              } catch {
                // skip invalid JSON chunks
              }
            }
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: '⚠️ Sorry, I couldn\'t connect to the AI. Please try again in a moment.' },
      ])
    }

    setStreaming(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleClear = () => {
    setMessages([{
      role: 'assistant',
      content: 'Conversation cleared. How can I help you today?',
    }])
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/30 to-purple-700/20 border border-purple-500/20 flex items-center justify-center">
            <Bot size={18} className="text-purple-400" />
          </div>
          <div>
            <h1 className="font-playfair font-bold text-xl text-neon-white">AI Financial Advisor</h1>
            <p className="text-text-muted text-xs">Powered by Qwen 3.5 · SEBI-aware · Student-focused</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleClear}>
          <RefreshCw size={12} /> Clear
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
              msg.role === 'assistant'
                ? 'bg-purple-500/20 border border-purple-500/20 text-purple-400'
                : 'bg-gold/15 border border-gold/20 text-gold'
            }`}>
              {msg.role === 'assistant' ? <Bot size={14} /> : user?.displayName?.[0] ?? 'U'}
            </div>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gold/10 border border-gold/15 text-neon-white rounded-tr-none'
                  : 'bg-bg-card border border-metallic-grey/30 text-neon-white rounded-tl-none'
              } ${streaming && i === messages.length - 1 && msg.role === 'assistant' && !msg.content ? 'animate-pulse' : ''}`}
              style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
            >
              {msg.content || (streaming && i === messages.length - 1 ? (
                <span className="flex gap-1 items-center text-text-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              ) : '')}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested questions (show only at start) */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3 flex-shrink-0">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="text-xs px-3 py-1.5 rounded-full bg-bg-card border border-metallic-grey/30 text-text-muted hover:text-gold-light hover:border-gold/20 transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-3 items-end flex-shrink-0">
        <div className="flex-1 bg-bg-card border border-metallic-grey rounded-2xl p-3 focus-within:border-gold/40 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about budgeting, investments, EMI..."
            className="w-full bg-transparent text-sm text-neon-white placeholder:text-text-muted focus:outline-none resize-none min-h-[24px] max-h-32"
            rows={1}
            disabled={streaming}
          />
        </div>
        <Button
          onClick={() => sendMessage()}
          disabled={!input.trim() || streaming}
          loading={streaming}
          size="md"
          className="flex-shrink-0 rounded-2xl h-12 w-12 p-0"
        >
          <Send size={16} />
        </Button>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-text-muted text-center mt-2 flex-shrink-0">
        AI responses are educational only. Not financial advice. Consult a SEBI-registered advisor for personalised guidance.
      </p>
    </div>
  )
}
