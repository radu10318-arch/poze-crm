import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
  danger?: boolean
}

export function StatCard({ label, value, sub, accent, danger }: StatCardProps) {
  return (
    <div className={cn(
      'card',
      accent && 'border-l-2 border-l-brand-gold',
      danger && 'border-l-2 border-l-red-400',
    )}>
      <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={cn(
        'text-2xl font-medium',
        danger ? 'text-red-600' : 'text-stone-900'
      )}>{value}</p>
      {sub && <p className="text-xs text-stone-400 mt-1">{sub}</p>}
    </div>
  )
}
