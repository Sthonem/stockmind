'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'

import {
  type ScenarioTemplate,
} from '@/components/scenarios/ScenarioTemplateCard'
import {
  ScenarioResult,
  type ScenarioAnalysisResult,
} from '@/components/scenarios/ScenarioResult'
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
    queryFn: () => agentApi.scenarioTemplates().then((r) => r.data),
  })

  const templates = templatesData?.templates || []
  const portfolioTickers = portfolio?.positions?.map((p) => p.ticker) || []

  const runScenario = useMutation<ScenarioAnalysisResult>({
    mutationFn: () => {
      const template = templates.find((t) => t.key === selectedTemplate)
      const scenario = customScenario.trim() || template?.description || 'Market scenario analysis'
      const tickers = selectedTickers.length > 0 ? selectedTickers : portfolioTickers
      return agentApi.scenario(scenario, tickers, portfolioId || undefined, selectedTemplate || undefined)
        .then((r) => r.data)
    },
    onSuccess: setResult,
  })

  const toggleTicker = (ticker: string) => {
    setSelectedTickers((prev) =>
      prev.includes(ticker) ? prev.filter((t) => t !== ticker) : [...prev, ticker]
    )
  }

  const canRun = Boolean(customScenario.trim() || selectedTemplate) &&
    (selectedTickers.length > 0 || portfolioTickers.length > 0)

  const selectedTemplateMeta = templates.find((t) => t.key === selectedTemplate)

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 32px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#F0F4FF', letterSpacing: -0.5, marginBottom: 4 }}>
          Scenario Analysis
        </h1>
        <p style={{ fontSize: 13, color: '#8B96B0' }}>
          Simulate how market events would affect your positions
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Templates */}
          <div style={{
            background: '#0E1420',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14,
            padding: '18px 20px',
          }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#4A5568', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 14 }}>
              Scenario Templates
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {templates.map((t) => (
                <button
                  key={t.key}
                  onClick={() => { setSelectedTemplate(selectedTemplate === t.key ? null : t.key); setCustomScenario('') }}
                  style={{
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                    padding: '12px 14px', borderRadius: 10, textAlign: 'left',
                    background: selectedTemplate === t.key ? '#1A2333' : '#141C2B',
                    border: `1px solid ${selectedTemplate === t.key ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)'}`,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#F0F4FF' }}>{t.name}</p>
                    <p style={{ fontSize: 11, color: '#8B96B0', marginTop: 2 }}>{t.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom scenario */}
          <div style={{
            background: '#0E1420',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14,
            padding: '18px 20px',
          }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#4A5568', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>
              Custom Scenario
            </p>
            <textarea
              value={customScenario}
              onChange={(e) => { setCustomScenario(e.target.value); if (e.target.value) setSelectedTemplate(null) }}
              placeholder="Describe a market scenario... e.g. 'China imposes new semiconductor export restrictions' or 'Oil prices spike to $150/barrel'"
              rows={3}
              style={{
                width: '100%', borderRadius: 8, background: '#141C2B',
                border: '1px solid rgba(255,255,255,0.07)', color: '#F0F4FF',
                padding: '10px 12px', fontSize: 13, outline: 'none', resize: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            background: '#0E1420',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14,
            padding: '18px 20px',
          }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#4A5568', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>
              Stocks to Analyze
            </p>
            {portfolioTickers.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {portfolioTickers.map((ticker) => (
                  <button
                    key={ticker}
                    onClick={() => toggleTicker(ticker)}
                    style={{
                      padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                      background: selectedTickers.includes(ticker) || selectedTickers.length === 0 ? '#3b82f6' : '#141C2B',
                      color: selectedTickers.includes(ticker) || selectedTickers.length === 0 ? '#fff' : '#8B96B0',
                      border: 'none', cursor: 'pointer',
                    }}
                  >
                    {ticker}
                  </button>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: '#4A5568' }}>No positions in portfolio</p>
            )}
          </div>

          <button
            onClick={() => runScenario.mutate()}
            disabled={!canRun || runScenario.isPending}
            style={{
              width: '100%', height: 44, borderRadius: 10,
              background: !canRun || runScenario.isPending ? '#141C2B' : '#3b82f6',
              color: '#fff', fontSize: 14, fontWeight: 700,
              border: 'none', cursor: canRun && !runScenario.isPending ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: !canRun ? 0.4 : 1,
            }}
          >
            {runScenario.isPending ? '⏳ Analyzing...' : '▶ Run Analysis'}
          </button>

          {result && (
            <div style={{
              background: 'rgba(244,63,94,0.04)',
              border: '1px solid rgba(244,63,94,0.2)',
              borderRadius: 14, padding: '18px 20px',
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#f43f5e', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>
                {selectedTemplateMeta?.name || 'Analysis'} Impact
              </p>
              <ScenarioResult result={result} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
