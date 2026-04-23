'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { PageHeader } from '@/components/ui/PageHeader'
import { SERVICE_TYPE_LABELS, formatCurrency } from '@/lib/utils'
import type { Client, ServiceType, PricingType, ExtraOption } from '@/types'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function NewOfferPage() {
  const router = useRouter()
  const params = useSearchParams()
  const supabase = createClient()

  const [clients, setClients] = useState<Client[]>([])
  const [clientId, setClientId] = useState(params.get('client') ?? '')
  const [serviceType, setServiceType] = useState<ServiceType>('nunta')
  const [pricingType, setPricingType] = useState<PricingType>('pachet_fix')
  const [basePrice, setBasePrice] = useState(0)
  const [durationHours, setDurationHours] = useState(0)
  const [description, setDescription] = useState('')
  const [extras, setExtras] = useState<ExtraOption[]>([])
  const [validUntil, setValidUntil] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('clients').select('id,full_name').then(({ data }) => setClients((data ?? []) as Client[]))

  const extraTotal = extras.reduce((s, e) => s + (e.price || 0), 0)
  const total = (basePrice || 0) + extraTotal

  function addExtra() {
    setExtras(prev => [...prev, { label: '', price: 0 }])
  }

  function updateExtra(i: number, field: keyof ExtraOption, val: string | number) {
    setExtras(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e))
  }

  function removeExtra(i: number) {
    setExtras(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSave(status: 'draft' | 'trimisa') {
    if (!clientId) { toast.error('Selectează un client'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { data: offer, error } = await supabase.from('offers').insert({
      client_id: clientId,
      pricing_type: pricingType,
      service_type: serviceType,
      description,
      duration_hours: durationHours || null,
      base_price: basePrice,
      extra_options: extras,
      total_price: total,
      status,
      valid_until: validUntil || null,
      user_id: user!.id,
    }).select().single()

    if (error) { toast.error('Eroare la salvare'); setSaving(false); return }

    // Timeline
    await supabase.from('timeline_entries').insert({
      client_id: clientId,
      entry_type: status === 'draft' ? 'oferta_creata' : 'oferta_trimisa',
      description: status === 'draft'
        ? `Ofertă creată · ${formatCurrency(total)}`
        : `Ofertă trimisă · ${formatCurrency(total)}`,
      metadata: { offer_id: offer.id, amount: total },
      user_id: user!.id,
    })

    // Update client pipeline
    if (status === 'trimisa') {
      await supabase.from('clients').update({ pipeline_status: 'oferta_trimisa' }).eq('id', clientId)
    }

    toast.success(status === 'draft' ? 'Ofertă salvată ca draft' : 'Ofertă salvată și marcată ca trimisă')
    router.push(`/oferte/${offer.id}`)
  }

  return (
    <div>
      <PageHeader title="Ofertă nouă" />

      <div className="p-6 max-w-2xl">
        <div className="card space-y-5">
          {/* Client */}
          <div>
            <label className="label">Client *</label>
            <select className="input" value={clientId} onChange={e => setClientId(e.target.value)}>
              <option value="">Selectează client...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
          </div>

          {/* Service type */}
          <div>
            <label className="label">Tip serviciu *</label>
            <select className="input" value={serviceType} onChange={e => setServiceType(e.target.value as ServiceType)}>
              {Object.entries(SERVICE_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* Pricing type */}
          <div>
            <label className="label">Tip prețuri</label>
            <div className="flex gap-2">
              {(['pachet_fix', 'per_ora', 'per_serviciu'] as PricingType[]).map(pt => (
                <button key={pt} onClick={() => setPricingType(pt)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm border transition-all ${
                    pricingType === pt
                      ? 'bg-brand-brown text-brand-cream border-brand-brown'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-brand-gold/50'
                  }`}>
                  {{ pachet_fix: 'Pachet fix', per_ora: 'Per oră', per_serviciu: 'Per serviciu' }[pt]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Base price */}
            <div>
              <label className="label">
                {pricingType === 'per_ora' ? 'Preț / oră (lei)' : 'Preț de bază (lei)'}
              </label>
              <input type="number" className="input" value={basePrice || ''}
                onChange={e => setBasePrice(Number(e.target.value))} placeholder="0" />
            </div>

            {/* Duration */}
            {pricingType === 'per_ora' && (
              <div>
                <label className="label">Ore estimate</label>
                <input type="number" className="input" value={durationHours || ''}
                  onChange={e => setDurationHours(Number(e.target.value))} placeholder="0" />
              </div>
            )}

            {/* Valid until */}
            <div>
              <label className="label">Valabilă până la</label>
              <input type="date" className="input" value={validUntil}
                onChange={e => setValidUntil(e.target.value)} />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label">Descriere serviciu</label>
            <textarea className="input min-h-[80px] resize-none" value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ce include oferta..." />
          </div>

          {/* Extras */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Extra opțiuni</label>
              <button onClick={addExtra} className="flex items-center gap-1 text-xs text-brand-gold hover:underline">
                <Plus size={13} /> Adaugă
              </button>
            </div>
            {extras.map((extra, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input className="input flex-1" placeholder="Descriere (ex: Album foto)"
                  value={extra.label} onChange={e => updateExtra(i, 'label', e.target.value)} />
                <input type="number" className="input w-28" placeholder="Lei"
                  value={extra.price || ''} onChange={e => updateExtra(i, 'price', Number(e.target.value))} />
                <button onClick={() => removeExtra(i)} className="text-stone-400 hover:text-red-500 px-1">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="bg-brand-cream rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm text-stone-600">Total ofertă</span>
            <span className="text-2xl font-semibold text-brand-brown">{formatCurrency(total)}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={() => handleSave('draft')} disabled={saving}
              className="btn btn-secondary flex-1">
              Salvează draft
            </button>
            <button onClick={() => handleSave('trimisa')} disabled={saving}
              className="btn btn-primary flex-1">
              Marchează ca trimisă
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
