'use client'

import { useState } from 'react'

import { BollingerChart } from './BollingerChart'
import { MACDChart } from './MACDChart'
import { RSIChart } from './RSIChart'

type Tab = 'rsi' | 'macd' | 'bollinger'

export function IndicatorPanel({ ticker }: { ticker: string }) {
  const [activeTab, setActiveTab] = useState<Tab>('rsi')

  const tabs: { key: Tab; label: string }[] = [
    { key: 'rsi', label: 'RSI' },
    { key: 'macd', label: 'MACD' },
    { key: 'bollinger', label: 'Bollinger' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-gray-800 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-gray-700 text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'rsi' && <RSIChart ticker={ticker} height={200} />}
        {activeTab === 'macd' && <MACDChart ticker={ticker} height={200} />}
        {activeTab === 'bollinger' && <BollingerChart ticker={ticker} height={220} />}
      </div>
    </div>
  )
}
