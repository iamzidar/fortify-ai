'use client'

import { useState, useRef, useEffect, FormEvent } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { Navbar } from '@/components/dashboard/Navbar'
import { chatStream } from '@/lib/api'

interface Message {
  role: 'user' | 'assistant' | 'tool_call' | 'tool_result'
  content: string
}

function MessageBubble({ msg }: { msg: Message }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-2xl bg-orange-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm">
          {msg.content}
        </div>
      </div>
    )
  }

  if (msg.role === 'tool_call') {
    let parsed: { toolName?: string; input?: unknown } = {}
    try { parsed = JSON.parse(msg.content) } catch { /* ignore */ }
    return (
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-white text-xs">⚙</span>
        </div>
        <div className="bg-slate-100 rounded-xl px-4 py-2 text-xs font-mono text-slate-600 max-w-2xl overflow-auto">
          <span className="font-semibold text-slate-800">{parsed.toolName}</span>
          {parsed.input && (
            <pre className="mt-1 text-slate-500">{JSON.stringify(parsed.input, null, 2)}</pre>
          )}
        </div>
      </div>
    )
  }

  if (msg.role === 'tool_result') {
    return (
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-green-700 text-xs">✓</span>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2 text-xs font-mono text-green-800 max-w-2xl overflow-auto max-h-48">
          {msg.content}
        </div>
      </div>
    )
  }

  // Assistant message — render markdown-like text
  return (
    <div className="flex justify-start">
      <div className="max-w-2xl bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm whitespace-pre-wrap text-gray-800">
        {msg.content}
      </div>
    </div>
  )
}

function ChatContent() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [convId, setConvId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setLoading(true)

    setMessages((prev) => [...prev, { role: 'user', content: text }])

    let assistantBuffer = ''

    const abort = chatStream(
      text,
      convId,
      (type, data) => {
        if (type === 'text_delta') {
          assistantBuffer += data
          setMessages((prev) => {
            const last = prev[prev.length - 1]
            if (last?.role === 'assistant') {
              return [...prev.slice(0, -1), { role: 'assistant', content: assistantBuffer }]
            }
            return [...prev, { role: 'assistant', content: assistantBuffer }]
          })
        } else if (type === 'tool_call') {
          setMessages((prev) => [...prev, { role: 'tool_call', content: data }])
        } else if (type === 'tool_result') {
          setMessages((prev) => [...prev, { role: 'tool_result', content: data }])
        } else if (type === 'error') {
          setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${data}` }])
        }
      },
      (newConvId) => {
        setConvId(newConvId)
        assistantBuffer = ''
        setLoading(false)
      },
    )

    abortRef.current = abort
  }

  const suggestions = [
    'List all applications',
    'Show critical vulnerabilities in the latest version',
    'What are the most common vulnerability categories?',
    'Check scan status for all app versions',
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">Fortify AI Assistant</h2>
              <p className="text-sm text-gray-500 mt-1">Ask anything about your Fortify SSC security posture</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 w-full max-w-lg">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => { setInput(s) }}
                  className="text-left px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-orange-300 hover:bg-orange-50 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}

        {loading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white px-4 py-4">
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about vulnerabilities, scan status, applications…"
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-200 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Send
          </button>
        </form>
        {convId && (
          <p className="text-xs text-gray-400 text-center mt-2 font-mono">
            Session: {convId.substring(0, 8)}
          </p>
        )}
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <AuthGuard>
      <Navbar />
      <ChatContent />
    </AuthGuard>
  )
}
