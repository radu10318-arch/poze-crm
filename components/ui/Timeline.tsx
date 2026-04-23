import { formatDate } from '@/lib/utils'
import type { TimelineEntry } from '@/types'

interface TimelineProps {
  entries: TimelineEntry[]
}

const ENTRY_COLORS: Record<string, string> = {
  client_creat: 'bg-stone-300',
  lead_nou: 'bg-stone-300',
  oferta_creata: 'bg-amber-300',
  oferta_trimisa: 'bg-amber-400',
  oferta_acceptata: 'bg-green-400',
  oferta_respinsa: 'bg-red-400',
  contract_incarcat: 'bg-blue-300',
  contract_semnat: 'bg-blue-400',
  avans_primit: 'bg-brand-gold',
  eveniment_programat: 'bg-purple-400',
  editare_inceput: 'bg-orange-400',
  galerie_livrata: 'bg-teal-400',
  plata_finala: 'bg-green-500',
  nota_adaugata: 'bg-stone-300',
  pipeline_schimbat: 'bg-stone-300',
  data_modificata: 'bg-stone-300',
}

export function Timeline({ entries }: TimelineProps) {
  if (!entries.length) {
    return <p className="text-sm text-stone-400 py-4">Nicio activitate înregistrată.</p>
  }

  return (
    <div className="relative pl-5">
      {entries.map((entry, i) => (
        <div key={entry.id} className="relative pb-5">
          {/* Line */}
          {i < entries.length - 1 && (
            <span className="absolute left-[-14px] top-3 bottom-0 w-px bg-stone-200" />
          )}
          {/* Dot */}
          <span className={`absolute left-[-17px] top-1.5 w-2.5 h-2.5 rounded-full ${ENTRY_COLORS[entry.entry_type] ?? 'bg-stone-300'}`} />
          {/* Content */}
          <p className="text-xs text-stone-400 mb-0.5">{formatDate(entry.created_at)}</p>
          <p className="text-sm text-stone-800">{entry.description}</p>
        </div>
      ))}
    </div>
  )
}
