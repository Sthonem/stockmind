'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'

import { Badge } from '@/components/ui/Badge'
import { agentApi } from '@/lib/api'
import { usePortfolios } from '@/lib/hooks'
import type { Portfolio } from '@/lib/types'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  tokensUsed?: number
}

interface AgentResponse {
  answer: string
  tokens_used?: number
}

function currentTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const suggestions = [
  'How concentrated is my portfolio?',
  'NVDA risk vs reward right now',
  'Best stop-loss level for TSLA',
  'Am I too heavy in tech?',
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [portfolioContext, setPortfolioContext] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: portfoliosData } = usePortfolios()
  const portfolios = (portfoliosData || []) as Portfolio[]
  const portfolioId = portfolios[0]?.id

  const sendMessage = useMutation<AgentResponse, Error, string>({
    mutationFn: (question: string) =>
      agentApi.ask(
        question,
        portfolioContext ? portfolioId : undefined,
        messages.map((m) => ({ role: m.role, content: m.content }))
      ).then((res) => res.data),
    onMutate: (question) => {
      // Show the user's message immediately, before the AI responds
      setMessages((prev) => [...prev, { role: 'user', content: question, timestamp: currentTime() }])
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.answer, timestamp: currentTime(), tokensUsed: data.tokens_used },
      ])
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again in a moment.', timestamp: currentTime() },
      ])
    },
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sendMessage.isPending])

  const handleSend = (text: string) => {
    if (!text.trim() || sendMessage.isPending) return
    setInput('')
    sendMessage.mutate(text)
  }

  const isEmpty = messages.length === 0

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 56px)',
      maxWidth: 780,
      margin: '0 auto',
      padding: '0 32px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 0 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 900, color: '#000',
          }}>S</div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#F0F4FF' }}>StockMind AI</p>
            <p style={{ fontSize: 11, color: '#22c55e' }}>● online · portfolio context {portfolioContext ? 'on' : 'off'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#8B96B0', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={portfolioContext}
              onChange={(e) => setPortfolioContext(e.target.checked)}
              style={{ accentColor: '#22c55e' }}
            />
            Portfolio context
          </label>
          <Badge label="Llama 3.3 70B · Groq" color="purple" />
        </div>
      </div>

      {/* Message area */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8, display: 'flex', flexDirection: 'column', gap: 0 }}>
        {isEmpty && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 24, padding: '40px 0' }}>
            <p style={{ fontSize: 15, color: '#8B96B0' }}>What do you want to know about your portfolio?</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {suggestions.map((s) => (
                <button key={s} onClick={() => handleSend(s)} style={{
                  padding: '8px 16px', borderRadius: 20,
                  background: '#0E1420', border: '1px solid rgba(255,255,255,0.07)',
                  color: '#8B96B0', fontSize: 13, cursor: 'pointer',
                }}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isAI = msg.role === 'assistant'
          const showTime = i === 0 || messages[i - 1].role !== msg.role
          return (
            <div key={i} style={{
              display: 'flex', gap: 10, marginBottom: 4,
              flexDirection: isAI ? 'row' : 'row-reverse',
              alignItems: 'flex-end',
            }}>
              {isAI && (
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginBottom: 2,
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 900, color: '#000',
                  visibility: showTime ? 'visible' : 'hidden',
                }}>S</div>
              )}
              <div style={{ maxWidth: '72%' }}>
                {showTime && (
                  <p style={{ fontSize: 10, color: '#4A5568', marginBottom: 4, textAlign: isAI ? 'left' : 'right' }}>{msg.timestamp}</p>
                )}
                <div style={{
                  background: isAI ? '#0E1420' : '#3b82f6',
                  border: isAI ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
                  borderRadius: isAI ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                  padding: '10px 14px',
                  fontSize: 13, color: '#F0F4FF', lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                }}>{msg.content}</div>
              </div>
            </div>
          )
        })}

        {sendMessage.isPending && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 4 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#000' }}>S</div>
            <div style={{ background: '#0E1420', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '4px 14px 14px 14px', padding: '12px 16px', display: 'flex', gap: 4 }}>
              {[0, 1, 2].map((j) => (
                <span key={j} style={{
                  width: 5, height: 5, borderRadius: '50%', background: '#8B96B0', display: 'block',
                  animation: 'chatbounce 1s infinite',
                  animationDelay: `${j * 0.18}s`,
                }} />
              ))}
            </div>
          </div>
        )}

        {!isEmpty && messages.length <= 4 && !sendMessage.isPending && (
          <div style={{ paddingTop: 12, display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {suggestions.slice(0, 3).map((s) => (
              <button key={s} onClick={() => handleSend(s)} style={{
                padding: '6px 12px', borderRadius: 20,
                background: '#0E1420', border: '1px solid rgba(255,255,255,0.07)',
                color: '#4A5568', fontSize: 12, cursor: 'pointer',
              }}>{s}</button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{ paddingBottom: 20, paddingTop: 10 }}>
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center',
          background: '#0E1420', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 12, padding: '6px 6px 6px 14px',
        }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend(input)}
            placeholder="Message StockMind..."
            style={{
              flex: 1, background: 'transparent', border: 'none',
              color: '#F0F4FF', fontSize: 13, outline: 'none', lineHeight: 1.5,
            }}
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || sendMessage.isPending}
            style={{
              height: 34, padding: '0 16px', borderRadius: 8,
              background: input.trim() ? '#3b82f6' : '#141C2B',
              color: input.trim() ? '#fff' : '#4A5568',
              fontSize: 13, fontWeight: 600, border: 'none',
              cursor: input.trim() ? 'pointer' : 'default',
              transition: 'all 0.15s',
            }}
          >↑</button>
        </div>
        <p style={{ textAlign: 'center', fontSize: 10, color: '#4A5568', marginTop: 8 }}>
          Not financial advice — always do your own research.
        </p>
      </div>
    </div>
  )
}
