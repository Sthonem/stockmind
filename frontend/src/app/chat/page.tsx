'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'

import { ChatInput } from '@/components/chat/ChatInput'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { SuggestedQuestions } from '@/components/chat/SuggestedQuestions'
import { Card } from '@/components/ui/Card'
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

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
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
        messages.map((message) => ({ role: message.role, content: message.content }))
      ).then((response) => response.data),
    onSuccess: (data, question) => {
      const timestamp = currentTime()
      setMessages((previous) => [
        ...previous,
        { role: 'user', content: question, timestamp },
        {
          role: 'assistant',
          content: data.answer,
          timestamp,
          tokensUsed: data.tokens_used,
        },
      ])
    },
    onError: () => {
      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please check your GROQ_API_KEY configuration.',
          timestamp: currentTime(),
        },
      ])
    },
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sendMessage.isPending])

  const handleSend = (message: string) => {
    sendMessage.mutate(message)
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Chat</h1>
          <p className="text-gray-500 text-sm mt-1">
            Ask questions about your portfolio and market conditions
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={portfolioContext}
            onChange={(event) => setPortfolioContext(event.target.checked)}
            className="rounded"
          />
          Include portfolio context
        </label>
      </div>

      <Card className="flex flex-col min-h-[500px]">
        <div className="flex-1 space-y-4 mb-4 overflow-y-auto max-h-[480px]">
          {messages.length === 0 ? (
            <div className="py-6">
              <p className="text-gray-500 text-sm text-center mb-6">
                StockMind AI is ready. Ask anything about your portfolio.
              </p>
              <SuggestedQuestions onSelect={handleSend} />
            </div>
          ) : (
            messages.map((message, index) => (
              <ChatMessage
                key={`${message.role}-${message.timestamp}-${index}`}
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
                tokensUsed={message.tokensUsed}
              />
            ))
          )}

          {sendMessage.isPending && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-300">
                AI
              </div>
              <div className="bg-gray-800 rounded-xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((index) => (
                    <span
                      key={index}
                      className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: `${index * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-gray-800 pt-4">
          <ChatInput
            onSend={handleSend}
            isLoading={sendMessage.isPending}
            placeholder="Ask about your portfolio risk, market conditions, stop-loss levels..."
          />
          <p className="text-gray-700 text-xs mt-2 text-center">
            Not financial advice. Always do your own research.
          </p>
        </div>
      </Card>
    </div>
  )
}
