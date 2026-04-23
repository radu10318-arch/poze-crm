import { getInitials, cn } from '@/lib/utils'

const COLORS = [
  'bg-amber-100 text-amber-800',
  'bg-stone-100 text-stone-700',
  'bg-green-100 text-green-800',
  'bg-blue-100 text-blue-800',
  'bg-purple-100 text-purple-800',
]

function colorForName(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  const sizeClass = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' }[size]
  return (
    <div className={cn(
      'rounded-full flex items-center justify-center font-medium flex-shrink-0',
      sizeClass,
      colorForName(name),
      className
    )}>
      {getInitials(name)}
    </div>
  )
}
