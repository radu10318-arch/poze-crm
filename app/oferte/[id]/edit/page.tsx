'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { PageHeader } from '@/components/ui/PageHeader'
import { SERVICE_TYPE_LABELS, formatCurrency } from '@/lib/utils'
import type { ServiceType, PricingType, ExtraOption, OfferStatus } from '@/types'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function EditOfertaPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const [clientName, setClientName] = useState('')
  const [clientId, setClientId] = useState('')
  const [serviceType, setServiceType] = useState<ServiceType>('nunta')
  const [pricingType, setPricingType] = useState<PricingType>('pachet_fix')
  const [basePrice, setBasePrice] = useState(0)
  const [durationHours, setDurationHours] = useState(0)
  const [description, setDescription] = useState('')
  const [extras, setExtras] = useState<ExtraOption[]>([])
  const [validUntil, setValidUntil] = useState('')
  const [status, setStatus] = useState<OfferStatus>('draft')

  useEffect(() => {
    supabase.from('offers').select('*, clients(full_name)').eq('id', id).single()
      .then(({ data }) => {
        if (!data) return
        setClientName((data.clients as { full_name: string } | null)?.full_name ?? '')
        setClientId(data.client_id)
        setServiceType(data.service_type as ServiceType)
        setPricingType(data.pricing_type as PricingType)
        setBasePrice(data.base_price)
        setDurationHours(data.duration_hours ?? 0)
        setDescription(data.description ?? '')
        setExtras((data.extra_options as ExtraOption[]) ?? [])
        setValidUntil(data.valid_until ?? '')
        setStatus(data.status as OfferStatus)
        setLoading(false)
      })
  }, [id])

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

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('offers').update({
      service_type: serviceType,
      pricing_type: pricingType,
      base_price: basePrice,
      duration_hours: durationHours || null,
      description,
      extra_options: extras,
      total_price: total,
      valid_until: validUntil || null,
      status,
    }).eq('id', id)

    if (error) { toast.error('Eroare: ' + error.message); setSaving(false); return }
    toast.success('Oferta actualizata!')
    router.push(`/oferte/${id}`)
  }

  if (loading) return <div className="p-10 text-stone-400">Se incarca...</div>

  return (
    <div>
      <PageHeader
        title={`Editeaza oferta — ${clientName}`}
        action={
          <div className="flex gap-2">
            <button onClick={() => router.back()} className="btn btn-secondary">Anuleaza</button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">
              {saving ? 'Se salveaza...' : 'Salveaza'}
            </button>
          </div>
        }
      />
      <div className="p-4 md:p-6 max-w-2xl space-y-5">
        <div className="card space-y-4">
          <p className="section-title">Detalii oferta</p>
          <div>
            <label className="label">Tip serviciu</label>
            <select className="input" value={serviceType} onChange={e => setServiceType(e.target.value as ServiceType)}>
              {Object.entries(SERVICE_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Tip pret</label>
            <div className="flex gap-2">
              {(['pachet_fix', 'per_ora', 'per_serviciu'] as PricingType[]).map(pt => (
                <button key={pt} onClick={() => setPricingType(pt)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm border transition-all ${
                    pricingType === pt
                      ? 'bg-brand-brown text-brand-cream border-brand-brown'
                      : 'bg-white text-stone-600 border-stone-200'
                  }`}>
                  {{ pachet_fix: 'Pachet fix', per_ora: 'Per ora', per_serviciu: 'Per serviciu' }[pt]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Pret de baza (lei)</label>
              <input type="number" className="input" value={basePrice || ''}
                onChange={e => setBasePrice(Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Valabila pana la</label>
              <input type="date" className="input" value={validUntil}
                onChange={e => setValidUntil(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Descriere</label>
            <textarea className="input resize-none min-h-[70px]" value={description}
              onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Extra optiuni</label>
              <button onClick={addExtra} className="flex items-center gap-1 text-xs text-brand-gold">
                <Plus size={13} /> Adauga
              </button>
            </div>
            {extras.map((extra, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input className="input flex-1" placeholder="Descriere"
                  value={extra.label} onChange={e => updateExtra(i, 'label', e.target.value)} />
                <input type="number" className="input w-24" placeholder="Lei"
                  value={extra.price || ''} onChange={e => updateExtra(i, 'price', Number(e.target.value))} />
                <button onClick={() => removeExtra(i)} className="text-stone-400 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="bg-brand-cream rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm text-stone-600">Total oferta</span>
            <span className="text-2xl font-semibold text-brand-brown">{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="card">
          <p className="section-title">Status oferta</p>
          <select className="input mt-2" value={status} onChange={e => setStatus(e.target.value as OfferStatus)}>
            <option value="draft">Draft</option>
            <option value="trimisa">Trimisa</option>
            <option value="acceptata">Acceptata</option>
            <option value="respinsa">Respinsa</option>
            <option value="expirata">Expirata</option>
          </select>
        </div>
      </div>
    </div>
  )
}
