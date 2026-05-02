'use client'

import { RefreshCcw } from 'lucide-react'

export function LoadingSpinner({
  label = 'Loading...',
  size = 'md',
}: {
  label?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 22 : 16
  const padding = size === 'sm' ? 'py-3' : size === 'lg' ? 'py-8' : 'py-6'

  return (
    <div className={`flex items-center justify-center gap-3 ${padding} text-sm text-gray-400`}>
      <RefreshCcw className="animate-spin" size={iconSize} />
      <span>{label}</span>
    </div>
  )
}
