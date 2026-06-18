interface StatBarProps {
  label: string
  value: number
  colorize?: boolean
}

export function StatBar({ label, value, colorize = true }: StatBarProps) {
  const pct = Math.min(100, Math.max(0, value))
  const barColor = !colorize
    ? 'bg-blue-500'
    : value >= 70
      ? 'bg-green-500'
      : value >= 40
        ? 'bg-yellow-500'
        : 'bg-red-500'
  const textColor = !colorize
    ? 'text-gray-300'
    : value >= 70
      ? 'text-green-400'
      : value >= 40
        ? 'text-yellow-400'
        : 'text-red-400'

  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400 text-xs w-16 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-800 rounded-full h-2">
        <div
          className={`${barColor} h-2 rounded-full`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-mono w-8 text-right ${textColor}`}>{value}</span>
    </div>
  )
}
