'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { RefreshCcw } from 'lucide-react'

import {
  ScenarioTemplateCard,
  type ScenarioTemplate,
} from '@/components/scenarios/ScenarioTemplateCard'
import {
  ScenarioResult,
  type ScenarioAnalysisResult,
} from '@/components/scenarios/ScenarioResult'
import { Card } from '@/components/ui/Card'
import { agentApi } from '@/lib/api'
import { usePortfolio, usePortfolios } from '@/lib/hooks'
import type { Portfolio } from '@/lib/types'

interface ScenarioTemplatesResponse {
  templates: ScenarioTemplate[]
}

export default function ScenariosPage() {
  const [customScenario, setCustomScenario] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [selectedTickers, setSelectedTickers] = useState<string[]>([])
  const [result, setResult] = useState<ScenarioAnalysisResult | null>(null)

  const { data: portfoliosData } = usePortfolios()
  const portfolios = (portfoliosData || []) as Portfolio[]
  const portfolioId = portfolios[0]?.id || null
  const { data: portfolioData } = usePortfolio(portfolioId)
  const portfolio = portfolioData as Portfolio | undefined

  const { data: templatesData } = useQuery<ScenarioTemplatesResponse>({
    queryKey: ['scenario-templates'],
    queryFn: () => agentApi.scenarioTemplates().then((response) => response.data),
  })

  const templates = templatesData?.templates || []
  const portfolioTickers = portfolio?.positions?.map((position) => position.ticker) || []

  const runScenario = useMutation<ScenarioAnalysisResult>({
    mutationFn: () => {
      const template = templates.find((item) => item.key === selectedTemplate)
      const scenario = customScenario.trim() || template?.description || 'Market scenario analysis'
      const tickers = selectedTickers.length > 0 ? selectedTickers : portfolioTickers

      return agentApi.scenario(
        scenario,
        tickers,
        portfolioId || undefined,
        selectedTemplate || undefined
      ).then((response) => response.data)
    },
    onSuccess: setResult,
  })

  const toggleTicker = (ticker: string) => {
    setSelectedTickers((previous) =>
      previous.includes(ticker)
        ? previous.filter((item) => item !== ticker)
        : [...previous, ticker]
    )
  }

  const canRun = Boolean(customScenario.trim() || selectedTemplate) &&
    (selectedTickers.length > 0 || portfolioTickers.length > 0)

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Scenario Analysis</h1>
        <p className="text-gray-500 text-sm mt-1">
          Simulate how market events would affect your positions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
              Scenario Templates
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {templates.map((template) => (
                <ScenarioTemplateCard
                  key={template.key}
                  template={template}
                  selected={selectedTemplate === template.key}
                  onSelect={() => {
                    setSelectedTemplate(
                      selectedTemplate === template.key ? null : template.key
                    )
                    setCustomScenario('')
                  }}
                />
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
              Custom Scenario
            </h2>
            <textarea
              value={customScenario}
              onChange={(event) => {
                setCustomScenario(event.target.value)
                if (event.target.value) setSelectedTemplate(null)
              }}
              placeholder="Describe a market scenario... e.g. 'China imposes new semiconductor export restrictions' or 'Oil prices spike to $150/barrel'"
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:border-blue-500 transition-colors"
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
              Stocks to Analyze
            </h2>
            {portfolioTickers.length > 0 ? (
              <div className="space-y-2">
                <p className="text-gray-600 text-xs">
                  {selectedTickers.length === 0
                    ? 'All portfolio positions will be analyzed'
                    : `${selectedTickers.length} selected`}
                </p>
                <div className="flex flex-wrap gap-2">
                  {portfolioTickers.map((ticker) => (
                    <button
                      key={ticker}
                      onClick={() => toggleTicker(ticker)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        selectedTickers.includes(ticker) || selectedTickers.length === 0
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {ticker}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-600 text-xs">No positions in portfolio</p>
            )}
          </Card>

          <button
            onClick={() => runScenario.mutate()}
            disabled={!canRun || runScenario.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors"
          >
            {runScenario.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCcw className="animate-spin" size={14} />
                Analyzing...
              </span>
            ) : 'Run Analysis'}
          </button>
        </div>
      </div>

      {result && (
        <Card>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
            Analysis Result
          </h2>
          <ScenarioResult result={result} />
        </Card>
      )}

      {!result && (
        <div className="text-center py-8 text-gray-600 text-sm">
          Select a scenario template or write a custom scenario, then click Run Analysis
        </div>
      )}
    </div>
  )
}
