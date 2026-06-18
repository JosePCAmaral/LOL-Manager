import type { Role } from '@types-app/index'

const ROLE_COLORS: Record<Role, string> = {
  TOP: 'bg-purple-700 text-purple-100',
  JUNGLE: 'bg-green-700 text-green-100',
  MID: 'bg-blue-700 text-blue-100',
  ADC: 'bg-orange-700 text-orange-100',
  SUPPORT: 'bg-yellow-700 text-yellow-100',
}

const ROLE_LABELS: Record<Role, string> = {
  TOP: 'TOP',
  JUNGLE: 'JGL',
  MID: 'MID',
  ADC: 'ADC',
  SUPPORT: 'SUP',
}

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${ROLE_COLORS[role]}`}
    >
      {ROLE_LABELS[role]}
    </span>
  )
}
