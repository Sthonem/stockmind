'use client'

import { useRef, useState, type KeyboardEvent } from 'react'

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading: boolean
  placeholder?: string
}

export function ChatInput({ onSend, isLoading, placeholder }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    const message = value.trim()
    if (!message || isLoading) return
    onSend(message)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  const handleInput = () => {
    const element = textareaRef.current
    if (element) {
      element.style.height = 'auto'
      element.style.height = `${Math.min(element.scrollHeight, 120)}px`
    }
  }

  return (
    <div className="flex gap-3 items-end">
      <div className="flex-1 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden focus-within:border-blue-500 transition-colors">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={placeholder || 'Ask about your portfolio...'}
          rows={1}
          disabled={isLoading}
          className="w-full bg-transparent text-white text-sm px-4 py-3 resize-none placeholder-gray-600 focus:outline-none disabled:opacity-50"
          style={{ maxHeight: 120 }}
        />
      </div>
      <button
        onClick={handleSend}
        disabled={isLoading || !value.trim()}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-4 py-3 text-sm font-medium transition-colors flex-shrink-0"
      >
        {isLoading ? '...' : 'Send'}
      </button>
    </div>
  )
}
