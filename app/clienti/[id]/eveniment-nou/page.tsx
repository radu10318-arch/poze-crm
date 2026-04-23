'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { PageHeader } from '@/components/ui/PageHeader'
import { SERVICE_TYPE_LABELS } from '@/lib/utils'
import type { ServiceType } from '@/types'
import { toast } from 'sonner'

export default function EvenimentNouPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    event_type: 'nunta' as ServiceType,
    date: '',
    start_time: '',
    end_time: '',
    location_primary: '',
    location_secondary: '',
    estimated_persons: '',
    contact_person: '',
    contact_phone: '',
    special_requirements: '',
    logistics_notes: '',
    delivery_deadline: '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!form.date || !form.start_time || !form.location_primary) {
      toast.error('Data, ora si locatia sunt obligatorii')
      return
    }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { data: event, error } = await supabase.from('events').insert({
      client_id: id,
      event_type: form.event_type,
      date: form.date,
      start_time: form.start_time,
      end_time: form.end_time || null,
      location_primary: form.location_primary,
      location_secondary: form.location_secondary || null,
      estimated_persons: form.estimated_persons ? parseInt(form.estimated_persons) : null,
      contact_person: form.contact_person || null,
      contact_phone: form.contact_phone || null,
      special_requirements: form.special_requirements || null,
      logistics_notes: form.logistics_notes || null,
      delivery_deadline: form.delivery_deadline || null,
      status: 'programat',
      user_id: user!.id,
    }).select().single()

    if (error) { toast.error('Eroare: ' + error.message); setSaving(false); return }

    await supabase.from('timeline_entries').insert({
      client_id: id,
      entry_type: 'eveniment_programat',
      description: `Eveniment programat · ${form.date}`,
      metadata: { date: form.date, event_id: event.id },
      user_id: user!.id,
    })

    await supabase.from('clients').update({ pipeline_status: 'programat' }).eq('id', id)

    toast.success('Eveniment adaugat!')
    router.push(`/clienti/${id}`)
  }

  return (
    <div>
      <PageHeader
        title="Eveniment nou"
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
          <p className="section-title">Detalii eveniment</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Tip eveniment</label>
              <select className="input" value={form.event_type}
                onChange={e => set('event_type', e.target.value)}>
                {Object.entries(SERVICE_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Data *</label>
              <input type="date" className="input" value={form.date}
                onChange={e => set('date', e.target.value)} />
            </div>
            <div>
              <label className="label">Ora inceput *</label>
              <input type="time" className="input" value={form.start_time}
                onChange={e => set('start_time', e.target.value)} />
            </div>
            <div>
              <label className="label">Ora final</label>
              <input type="time" className="input" value={form.end_time}
                onChange={e => set('end_time', e.target.value)} />
            </div>
            <div>
              <label className="label">Persoane estimate</label>
              <input type="number" className="input" value={form.estimated_persons}
                onChange={e => set('estimated_persons', e.target.value)} placeholder="100" />
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <p className="section-title">Locatie</p>
          <div>
            <label className="label">Locatie principala *</label>
            <input className="input" value={form.location_primary}
              onChange={e => set('location_primary', e.target.value)}
              placeholder="Ex: Restaurant Bella, Brasov" />
          </div>
          <div>
            <label className="label">Locatie secundara</label>
            <input className="input" value={form.location_secondary}
              onChange={e => set('location_secondary', e.target.value)}
              placeholder="Ex: Parcul Central" />
          </div>
        </div>

        <div className="card space-y-4">
          <p className="section-title">Contact si logistica</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Persoana de contact</label>
              <input className="input" value={form.contact_person}
                onChange={e => set('contact_person', e.target.value)} />
            </div>
            <div>
              <label className="label">Telefon contact</label>
              <input className="input" value={form.contact_phone}
                onChange={e => set('contact_phone', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Cerinte speciale</label>
            <textarea className="input resize-none" rows={2} value={form.special_requirements}
              onChange={e => set('special_requirements', e.target.value)}
              placeholder="Ex: Tort la ora 20:00, primul dans la 21:00..." />
          </div>
          <div>
            <label className="label">Note logistice</label>
            <textarea className="input resize-none" rows={2} value={form.logistics_notes}
              onChange={e => set('logistics_notes', e.target.value)}
              placeholder="Ex: Parcare limitata, acces din spatele cladirii..." />
          </div>
          <div>
            <label className="label">Deadline livrare galerie</label>
            <input type="date" className="input" value={form.delivery_deadline}
              onChange={e => set('delivery_deadline', e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  )
}
