'use client'

interface DailySummaryData {
  date: string
  generated_at: string
  indices_data: string
  market_regime: string
  news_theme: string
  summary: string
  tokens_used: number
}

interface ParsedIndex {
  ticker: string
  price: string
  change: string
}

export function DailySummaryCard({ data }: { data: DailySummaryData }) {
  const lines = data.summary.split('\n').filter(Boolean)
  const bottomLineIndex = lines.findIndex((line) =>
    line.toLowerCase().startsWith('bottom line')
  )
  const bodyLines = bottomLineIndex > 0 ? lines.slice(0, bottomLineIndex) : lines
  const bottomLine = bottomLineIndex > 0 ? lines[bottomLineIndex] : null

  const parseIndices = (raw: string): ParsedIndex[] => {
    return raw
      .split('\n')
      .map((line) => {
        const match = line.match(/^(\w+):\s+\$?([\d.]+)\s+\(([+-]?[\d.]+%)\)/)
        if (match) {
          return { ticker: match[1], price: match[2], change: match[3] }
        }
        return null
      })
      .filter((item): item is ParsedIndex => item !== null)
  }

  const indices = parseIndices(data.indices_data || '')

  const changeColor = (change: string) =>
    change.startsWith('+') ? 'text-green-400' : 'text-red-400'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Generated: {new Date(data.generated_at).toLocaleTimeString()}</span>
        <span>{data.tokens_used} tokens used</span>
      </div>

      {indices.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {indices.map((indexData) => (
            <div key={indexData.ticker} className="bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-gray-400 text-xs mb-1">{indexData.ticker}</p>
              <p className="text-white font-semibold">${indexData.price}</p>
              <p className={`text-xs font-medium ${changeColor(indexData.change)}`}>
                {indexData.change}
              </p>
            </div>
          ))}
        </div>
      )}

      {data.market_regime && (
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Market Regime</p>
          <p className="text-gray-300 text-sm">{data.market_regime.split('\n')[0]}</p>
        </div>
      )}

      <div className="space-y-2">
        {bodyLines.map((line, index) => (
          <p key={`${line}-${index}`} className="text-gray-300 text-sm leading-relaxed">
            {line}
          </p>
        ))}
      </div>

      {bottomLine && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <p className="text-blue-300 text-sm font-medium">{bottomLine}</p>
        </div>
      )}
    </div>
  )
}
