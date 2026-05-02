'use client'

const SUGGESTED_QUESTIONS = [
  'What is the overall risk level of my portfolio?',
  'Which of my positions has the highest risk right now?',
  'What should I watch out for this week?',
  'Explain the RSI signals for my holdings',
  'Are any of my positions correlated with each other?',
  'What stop-loss levels do you recommend?',
]

export function SuggestedQuestions({ onSelect }: { onSelect: (question: string) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-gray-600 text-xs uppercase tracking-wider">Suggested questions</p>
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_QUESTIONS.map((question) => (
          <button
            key={question}
            onClick={() => onSelect(question)}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded-full transition-colors text-left"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  )
}
