interface AttributeBarProps {
  label: string
  value: number
  max?: number
}

export function AttributeBar({ label, value, max = 20 }: AttributeBarProps) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400 text-xs w-28 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-800 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-gray-300 text-xs font-mono w-8 text-right">{value}</span>
    </div>
  )
}
