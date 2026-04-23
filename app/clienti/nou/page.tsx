'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { PageHeader } from '@/components/ui/PageHeader'
import { LEAD_SOURCE_LABELS } from '@/lib/utils'
import type { ClientType, LeadSource, ClientTag, PipelineStatus } from '@/types'
import { toast } from 'sonner'

export default function ClientNouPage() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    city: '',
    client_type: 'persoana_fizica' as ClientType,
    company_name: '',
    lead_source: '' as LeadSource | '',
    tags: [] as ClientTag[],
    pipeline_status: 'lead_nou' as PipelineStatus,
    notes: '',
  })

  function set(field: string, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function toggleTag(tag: ClientTag) {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }))
  }

  async function handleSave() {
    if (!form.full_name || !form.phone) {
      toast.error('Numele si telefonul sunt obligatorii')
      return
    }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { data: client, error } = await supabase.from('clients').insert({
      ...form,
      lead_source: form.lead_source || null,
      user_id: user!.id,
    }).select().single()

    if (error) { toast.error('Eroare: ' + error.message); setSaving(false); return }

    await supabase.from('timeline_entries').insert({
      client_id: client.id,
      entry_type: 'client_creat',
      description: 'Client creat',
      user_id: user!.id,
    })

    toast.success('Client adaugat!')
    router.push(`/clienti/${client.id}`)
  }

  const TAGS: ClientTag[] = ['nunta', 'corporate', 'recurent', 'urgent', 'recomandare', 'premium']

  return (
    <div>
      <PageHeader
        title="Client nou"
        action={
          <div className="flex gap-2">
            <button onClick={() => router.back()} className="btn btn-secondary">Anuleaza</button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">
              {saving ? 'Se salveaza...' : 'Salveaza'}
            </button>
          </div>
        }
      />
      <div className="p-6 max-w-2xl space-y-5">
        <div className="card space-y-4">
          <p className="section-title">Date principale</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Nume complet *</label>
              <input className="input" value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Ex: Andrei si Maria" />
            </div>
            <div>
              <label className="label">Telefon *</label>
              <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+40 7xx xxx xxx" />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@exemplu.ro" />
            </div>
            <div>
              <label className="label">Localitate</label>
              <input className="input" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Brasov" />
            </div>
            <div>
              <label className="label">Tip client</label>
              <select className="input" value={form.client_type} onChange={e => set('client_type', e.target.value)}>
                <option value="persoana_fizica">Persoana fizica</option>
                <option value="companie">Companie</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <p className="section-title">Origine si status</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Sursa lead</label>
              <select className="input" value={form.lead_source} onChange={e => set('lead_source', e.target.value)}>
                <option value="">Selecteaza...</option>
                {Object.entries(LEAD_SOURCE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status initial</label>
              <select className="input" value={form.pipeline_status} onChange={e => set('pipeline_status', e.target.value)}>
                <option value="lead_nou">Lead nou</option>
                <option value="in_discutie">In discutie</option>
                <option value="oferta_trimisa">Oferta trimisa</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Etichete</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {TAGS.map(tag => (
                <button key={tag} onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs border transition-all ${
                    form.tags.includes(tag)
                      ? 'bg-brand-brown text-brand-cream border-brand-brown'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                  }`}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <p className="section-title">Note interne</p>
          <textarea className="input min-h-[80px] resize-none mt-2" value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Orice informatie utila..." />
        </div>
      </div>
    </div>
  )
}
