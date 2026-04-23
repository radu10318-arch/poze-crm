'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { PageHeader } from '@/components/ui/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { OfferBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDate, SERVICE_TYPE_LABELS } from '@/lib/utils'
import type { Offer, OfferStatus } from '@/types'

interface OfferWithClient extends Offer {
  clients: { full_name: string } | null
}

const TABS: { label: string; value: OfferStatus | '' }[] = [
  { label: 'Toate', value: '' },
  { label: 'Draft', value: 'draft' },
  { label: 'Trimise', value: 'trimisa' },
  { label: 'Acceptate', value: 'acceptata' },
  { label: 'Respinse', value: 'respinsa' },
]

export default function OfertePage() {
  const [offers, setOffers] = useState<OfferWithClient[]>([])
  const [tab, setTab] = useState<OfferStatus | ''>('')
  const supabase = createClient()

  useEffect(() => {
    let q = supabase.from('offers').select('*, clients(full_name)').order('created_at', { ascending: false })
    if (tab) q = q.eq('status', tab)
    q.then(({ data }) => setOffers((data ?? []) as OfferWithClient[]))
  }, [tab])

  return (
    <div>
      <PageHeader
        title="Oferte"
        action={<Link href="/oferte/nou" className="btn btn-primary">+ Ofertă nouă</Link>}
      />
      <div className="p-4 md:p-6">
        <div className="flex gap-1 bg-stone-100 p-1 rounded-lg mb-5 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.value} onClick={() => setTab(t.value)}
              className={`px-3 py-1.5 rounded-md text-sm transition-all whitespace-nowrap ${
                tab === t.value
                  ? 'bg-white text-stone-900 shadow-sm font-medium'
                  : 'text-stone-500 hover:text-stone-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {!offers.length && (
            <div className="card text-center py-12 text-stone-400 text-sm">Nicio ofertă.</div>
          )}
          {offers.map(o => (
            <Link key={o.id} href={`/oferte/${o.id}`}>
              <div className="card hover:border-brand-gold/40 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Avatar name={o.clients?.full_name ?? '?'} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">{o.clients?.full_name}</p>
                    <p className="text-xs text-stone-400">{SERVICE_TYPE_LABELS[o.service_type] ?? o.service_type}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-stone-900">{formatCurrency(o.total_price)}</p>
                    <OfferBadge status={o.status} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
