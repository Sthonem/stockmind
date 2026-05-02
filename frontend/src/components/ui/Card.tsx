interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl p-6 ${className}`}>
      {children}
    </div>
  )
}

export function MetricCard({
  label,
  value,
  sub,
  color = 'white',
}: {
  label: string
  value: string | number
  sub?: string
  color?: 'white' | 'green' | 'red' | 'yellow'
}) {
  const colorMap = {
    white: 'text-white',
    green: 'text-green-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400',
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${colorMap[color]}`}>{value}</p>
      {sub ? <p className="text-gray-500 text-xs mt-2">{sub}</p> : null}
    </div>
  )
}
