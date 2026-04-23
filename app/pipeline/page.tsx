'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { PageHeader } from '@/components/ui/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { formatCurrency, PIPELINE_LABELS, PIPELINE_ORDER } from '@/lib/utils'
import type { Client } from '@/types'

export default function PipelinePage() {
  const [clients, setClients] = useState<Client[]>([])
  const supabase = createClient()

  useEffect(() => {
    supabase.from('clients').select('*').then(({ data }) => setClients(data ?? []))
  }, [])

  const grouped = PIPELINE_ORDER.reduce((acc, status) => {
    acc[status] = clients.filter(c => c.pipeline_status === status)
    return acc
  }, {} as Record<string, Client[]>)

  return (
    <div>
      <PageHeader
        title="Pipeline"
        subtitle="Fluxul complet de la lead la finalizare"
        action={<Link href="/clienti/nou" className="btn btn-primary">+ Lead nou</Link>}
      />

      <div className="p-6 overflow-x-auto">
        <div className="flex gap-3 min-w-max">
          {PIPELINE_ORDER.map(status => {
            const cols = grouped[status] ?? []
            return (
              <div key={status} className="w-44 flex-shrink-0">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                    {PIPELINE_LABELS[status]}
                  </span>
                  <span className="text-xs text-stone-400 bg-stone-100 rounded-full px-2 py-0.5">
                    {cols.length}
                  </span>
                </div>
                <div className={`h-0.5 rounded mb-3 ${cols.length > 0 ? 'bg-brand-gold' : 'bg-stone-200'}`} />
                <div className="space-y-2">
                  {cols.map(client => (
                    <Link key={client.id} href={`/clienti/${client.id}`}>
                      <div className="bg-white border border-stone-200 rounded-lg p-3 hover:border-brand-gold/40 hover:shadow-sm transition-all cursor-pointer">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar name={client.full_name} size="sm" />
                        </div>
                        <p className="text-xs font-medium text-stone-900 leading-tight mb-1">
                          {client.full_name}
                        </p>
                        <p className="text-xs text-stone-400">
                          {client.lead_source ?? '—'}
                        </p>
                        {client.tags && client.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {client.tags.slice(0, 2).map(t => (
                              <span key={t} className="text-[10px] bg-stone-50 border border-stone-200 text-stone-500 px-1.5 py-0.5 rounded">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                  {cols.length === 0 && (
                    <div className="border-2 border-dashed border-stone-100 rounded-lg p-4 text-center">
                      <p className="text-xs text-stone-300">—</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
