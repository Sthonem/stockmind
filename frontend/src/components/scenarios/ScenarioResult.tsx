'use client'

export interface ScenarioAnalysisResult {
  scenario: string
  tickers_analyzed: string[]
  analysis: string
  template_used?: string | null
  tokens_used: number
}

export function ScenarioResult({ result }: { result: ScenarioAnalysisResult }) {
  const lines = result.analysis.split('\n').filter(Boolean)
  const bottomLineIndex = lines.findIndex((line) => line.toLowerCase().startsWith('bottom line'))
  const bodyLines = bottomLineIndex > 0 ? lines.slice(0, bottomLineIndex) : lines
  const bottomLine = bottomLineIndex > 0 ? lines[bottomLineIndex] : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 text-xs text-gray-500">
        <div className="flex gap-2 flex-wrap">
          {result.tickers_analyzed.map((ticker) => (
            <span key={ticker} className="bg-gray-800 px-2 py-0.5 rounded text-gray-300">
              {ticker}
            </span>
          ))}
        </div>
        <span>{result.tokens_used} tokens</span>
      </div>

      <div className="space-y-2">
        {bodyLines.map((line, index) => (
          <p key={`${line}-${index}`} className="text-gray-300 text-sm leading-relaxed">
            {line}
          </p>
        ))}
      </div>

      {bottomLine && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <p className="text-blue-300 text-sm font-medium">{bottomLine}</p>
        </div>
      )}
    </div>
  )
}
