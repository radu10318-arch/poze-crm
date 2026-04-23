'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { PageHeader } from '@/components/ui/PageHeader'
import { SERVICE_TYPE_LABELS, formatCurrency } from '@/lib/utils'
import type { Client, ServiceType, PricingType, ExtraOption } from '@/types'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Suspense } from 'react'

function NewOfferContent() {
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

  // Eveniment
  const [eventDate, setEventDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [locationPrimary, setLocationPrimary] = useState('')
  const [locationSecondary, setLocationSecondary] = useState('')
  const [estimatedPersons, setEstimatedPersons] = useState('')
  const [deliveryDeadline, setDeliveryDeadline] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [contactPhone, setContactPhone] = useState('')

  // Financiar
  const [advanceAmount, setAdvanceAmount] = useState(0)
  const [advanceDueDate, setAdvanceDueDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('transfer')

  useEffect(() => {
    supabase.from('clients').select('*').then(({ data }) => setClients((data ?? []) as Client[]))
  }, [])

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
    if (!clientId) { toast.error('Selecteaza un client'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Creaza oferta
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

    if (error) { toast.error('Eroare oferta: ' + error.message); setSaving(false); return }

    // 2. Creaza eveniment daca are data
    let eventId = null
    if (eventDate && startTime && locationPrimary) {
      const { data: event } = await supabase.from('events').insert({
        client_id: clientId,
        offer_id: offer.id,
        event_type: serviceType,
        date: eventDate,
        start_time: startTime,
        end_time: endTime || null,
        location_primary: locationPrimary,
        location_secondary: locationSecondary || null,
        estimated_persons: estimatedPersons ? parseInt(estimatedPersons) : null,
        contact_person: contactPerson || null,
        contact_phone: contactPhone || null,
        delivery_deadline: deliveryDeadline || null,
        status: 'programat',
        user_id: user!.id,
      }).select().single()
      if (event) eventId = event.id
    }

    // 3. Creaza inregistrarea financiara
    await supabase.from('payments').insert({
      client_id: clientId,
      event_id: eventId,
      total_amount: total,
      advance_amount: advanceAmount || 0,
      remaining_amount: total - (advanceAmount || 0),
      due_date: advanceDueDate || null,
      payment_method: paymentMethod,
      status: advanceAmount > 0 ? 'avans_platit' : 'neplatit',
      user_id: user!.id,
    })

    // 4. Timeline
    await supabase.from('timeline_entries').insert({
      client_id: clientId,
      entry_type: status === 'draft' ? 'oferta_creata' : 'oferta_trimisa',
      description: `${status === 'draft' ? 'Oferta creata' : 'Oferta trimisa'} · ${formatCurrency(total)}`,
      metadata: { offer_id: offer.id, amount: total },
      user_id: user!.id,
    })

    // 5. Update pipeline client
    const newStatus = eventDate ? 'programat' : status === 'trimisa' ? 'oferta_trimisa' : 'in_discutie'
    await supabase.from('clients').update({ pipeline_status: newStatus }).eq('id', clientId)

    // 6. Google Calendar - daca e conectat si are data eveniment
    if (eventDate && startTime && locationPrimary) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/create-event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId,
            eventId,
            title: `${serviceType} - ${clients.find(c => c.id === clientId)?.full_name}`,
            date: eventDate,
            startTime,
            endTime,
            location: locationPrimary,
            description: description,
          }),
        })
      } catch (e) {
        // Calendar sync optional - nu blocheaza salvarea
      }
    }

    toast.success(status === 'draft' ? 'Oferta salvata ca draft' : 'Oferta salvata si trimisa!')
    router.push(`/clienti/${clientId}`)
  }

  return (
    <div>
      <PageHeader title="Oferta noua" />
      <div className="p-4 md:p-6 max-w-2xl space-y-5">

        {/* CLIENT SI SERVICIU */}
        <div className="card space-y-4">
          <p className="section-title">Client si serviciu</p>
          <div>
            <label className="label">Client *</label>
            <select className="input" value={clientId} onChange={e => setClientId(e.target.value)}>
              <option value="">Selecteaza client...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Tip serviciu *</label>
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
              <label className="label">{pricingType === 'per_ora' ? 'Pret / ora (lei)' : 'Pret de baza (lei)'}</label>
              <input type="number" className="input" value={basePrice || ''}
                onChange={e => setBasePrice(Number(e.target.value))} placeholder="0" />
            </div>
            {pricingType === 'per_ora' && (
              <div>
                <label className="label">Ore estimate</label>
                <input type="number" className="input" value={durationHours || ''}
                  onChange={e => setDurationHours(Number(e.target.value))} placeholder="0" />
              </div>
            )}
            <div>
              <label className="label">Valabila pana la</label>
              <input type="date" className="input" value={validUntil}
                onChange={e => setValidUntil(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Descriere serviciu</label>
            <textarea className="input min-h-[70px] resize-none" value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ce include oferta..." />
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

        {/* EVENIMENT */}
        <div className="card space-y-4">
          <p className="section-title">Eveniment (optional)</p>
          <p className="text-xs text-stone-400">Completeaza daca stii data — se adauga automat in calendar</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Data eveniment</label>
              <input type="date" className="input" value={eventDate}
                onChange={e => setEventDate(e.target.value)} />
            </div>
            <div>
              <label className="label">Ora inceput</label>
              <input type="time" className="input" value={startTime}
                onChange={e => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="label">Ora final</label>
              <input type="time" className="input" value={endTime}
                onChange={e => setEndTime(e.target.value)} />
            </div>
            <div>
              <label className="label">Persoane estimate</label>
              <input type="number" className="input" value={estimatedPersons}
                onChange={e => setEstimatedPersons(e.target.value)} placeholder="100" />
            </div>
            <div className="col-span-2">
              <label className="label">Locatie principala</label>
              <input className="input" value={locationPrimary}
                onChange={e => setLocationPrimary(e.target.value)}
                placeholder="Ex: Restaurant Bella, Brasov" />
            </div>
            <div className="col-span-2">
              <label className="label">Locatie secundara</label>
              <input className="input" value={locationSecondary}
                onChange={e => setLocationSecondary(e.target.value)}
                placeholder="Ex: Parcul Central" />
            </div>
            <div>
              <label className="label">Persoana de contact</label>
              <input className="input" value={contactPerson}
                onChange={e => setContactPerson(e.target.value)} />
            </div>
            <div>
              <label className="label">Telefon contact</label>
              <input className="input" value={contactPhone}
                onChange={e => setContactPhone(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Deadline livrare galerie</label>
              <input type="date" className="input" value={deliveryDeadline}
                onChange={e => setDeliveryDeadline(e.target.value)} />
            </div>
          </div>
        </div>

        {/* FINANCIAR */}
        <div className="card space-y-4">
          <p className="section-title">Avans si plata</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Avans cerut (lei)</label>
              <input type="number" className="input" value={advanceAmount || ''}
                onChange={e => setAdvanceAmount(Number(e.target.value))}
                placeholder="0" />
            </div>
            <div>
              <label className="label">Data scadenta avans</label>
              <input type="date" className="input" value={advanceDueDate}
                onChange={e => setAdvanceDueDate(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Metoda de plata preferata</label>
              <select className="input" value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}>
                <option value="transfer">Transfer bancar</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="alta">Alta</option>
              </select>
            </div>
          </div>
          {advanceAmount > 0 && (
            <div className="bg-amber-50 rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-600">Avans</span>
                <span className="font-medium">{formatCurrency(advanceAmount)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-stone-600">Rest de plata</span>
                <span className="font-medium text-red-600">{formatCurrency(total - advanceAmount)}</span>
              </div>
            </div>
          )}
        </div>

        {/* ACTIUNI */}
        <div className="flex gap-3">
          <button onClick={() => handleSave('draft')} disabled={saving}
            className="btn btn-secondary flex-1">
            Salveaza draft
          </button>
          <button onClick={() => handleSave('trimisa')} disabled={saving}
            className="btn btn-primary flex-1">
            Marcheaza trimisa
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NewOfferPage() {
  return (
    <Suspense fallback={<div className="p-10 text-stone-400">Se incarca...</div>}>
      <NewOfferContent />
    </Suspense>
  )
}
