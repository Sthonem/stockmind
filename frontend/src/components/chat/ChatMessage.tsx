'use client'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
  tokensUsed?: number
}

export function ChatMessage({ role, content, timestamp, tokensUsed }: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
        isUser ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
      }`}>
        {isUser ? 'U' : 'AI'}
      </div>

      <div className={`max-w-[80%] space-y-1 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-gray-800 text-gray-200 rounded-tl-sm'
        }`}>
          {content.split('\n').map((line, index) => (
            <p key={`${line}-${index}`} className={line === '' ? 'h-2' : ''}>
              {line}
            </p>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-600">
          {timestamp && <span>{timestamp}</span>}
          {tokensUsed && !isUser && <span>{tokensUsed} tokens</span>}
        </div>
      </div>
    </div>
  )
}
