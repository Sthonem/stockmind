'use client'

export interface ScenarioTemplate {
  key: string
  name: string
  description: string
}

export function ScenarioTemplateCard({
  template,
  selected,
  onSelect,
}: {
  template: ScenarioTemplate
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-xl p-3 border transition-colors ${
        selected
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-gray-800 bg-gray-900 hover:border-gray-700'
      }`}
    >
      <p className={`text-sm font-medium ${selected ? 'text-blue-400' : 'text-white'}`}>
        {template.name}
      </p>
      <p className="text-gray-500 text-xs mt-0.5 leading-snug">{template.description}</p>
    </button>
  )
}
