'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { PageHeader } from '@/components/ui/PageHeader'
import { OfferBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDate, SERVICE_TYPE_LABELS } from '@/lib/utils'
import type { Offer } from '@/types'
import Link from 'next/link'
import { toast } from 'sonner'

export default function OfertaPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [offer, setOffer] = useState<Offer & { clients: { full_name: string } | null } | null>(null)

  useEffect(() => {
    supabase.from('offers').select('*, clients(full_name)').eq('id', id).single()
      .then(({ data }) => setOffer(data))
  }, [id])

  async function updateStatus(status: string) {
    await supabase.from('offers').update({ status }).eq('id', id)
    setOffer(prev => prev ? { ...prev, status: status as Offer['status'] } : null)
    if (status === 'acceptata') {
      await supabase.from('clients').update({ pipeline_status: 'oferta_acceptata' }).eq('id', offer?.client_id)
    }
    toast.success('Status actualizat')
  }

  if (!offer) return <div className="p-10 text-stone-400 text-sm">Se incarca...</div>

  return (
    <div>
      <PageHeader
        title={`Oferta — ${offer.clients?.full_name}`}
        action={
          <div className="flex gap-2">
            <Link href="/oferte" className="btn btn-secondary">Inapoi</Link>
            <Link href={`/oferte/${id}/edit`} className="btn btn-primary">Editeaza</Link>
          </div>
        }
      />
      <div className="p-4 md:p-6 max-w-2xl space-y-4">
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-stone-900">{offer.clients?.full_name}</h2>
            <OfferBadge status={offer.status} />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="label">Serviciu</p>
              <p>{SERVICE_TYPE_LABELS[offer.service_type] ?? offer.service_type}</p>
            </div>
            <div>
              <p className="label">Tip pret</p>
              <p>{offer.pricing_type}</p>
            </div>
            <div>
              <p className="label">Pret de baza</p>
              <p>{formatCurrency(offer.base_price)}</p>
            </div>
            <div>
              <p className="label">Total</p>
              <p className="font-semibold text-brand-brown text-lg">{formatCurrency(offer.total_price)}</p>
            </div>
            {offer.valid_until && (
              <div>
                <p className="label">Valabila pana la</p>
                <p>{formatDate(offer.valid_until)}</p>
              </div>
            )}
            {offer.description && (
              <div className="col-span-2">
                <p className="label">Descriere</p>
                <p className="text-stone-600">{offer.description}</p>
              </div>
            )}
          </div>
          {offer.extra_options && (offer.extra_options as {label:string,price:number}[]).length > 0 && (
            <div>
              <p className="label">Extra optiuni</p>
              {(offer.extra_options as {label:string,price:number}[]).map((e, i) => (
                <div key={i} className="flex justify-between text-sm py-1 border-b border-stone-100">
                  <span>{e.label}</span>
                  <span>{formatCurrency(e.price)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {offer.status !== 'acceptata' && offer.status !== 'respinsa' && (
          <div className="card">
            <p className="section-title">Actualizeaza status</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <button onClick={() => updateStatus('trimisa')} className="btn btn-secondary">Trimisa</button>
              <button onClick={() => updateStatus('acceptata')} className="btn btn-primary">Acceptata</button>
              <button onClick={() => updateStatus('respinsa')} className="btn bg-red-50 text-red-700 border-red-200">Respinsa</button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Link href={`/clienti/${offer.client_id}`} className="text-sm text-brand-gold hover:underline">
            Vezi profil client →
          </Link>
          <button onClick={async () => {
            if (!confirm('Stergi aceasta oferta?')) return
            await supabase.from('offers').delete().eq('id', id)
            toast.success('Oferta stearsa')
            router.push('/oferte')
          }} className="text-xs text-red-400 hover:text-red-600 transition-colors">
            Sterge oferta
          </button>
        </div>
      </div>
    </div>
  )
}
