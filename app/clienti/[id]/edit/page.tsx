'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { PageHeader } from '@/components/ui/PageHeader'
import { LEAD_SOURCE_LABELS } from '@/lib/utils'
import type { Client, ClientType, LeadSource, ClientTag, PipelineStatus } from '@/types'
import { toast } from 'sonner'

export default function EditClientPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    city: '',
    address: '',
    client_type: 'persoana_fizica' as ClientType,
    company_name: '',
    billing_details: '',
    lead_source: '' as LeadSource | '',
    tags: [] as ClientTag[],
    pipeline_status: 'lead_nou' as PipelineStatus,
    notes: '',
  })

  useEffect(() => {
    supabase.from('clients').select('*').eq('id', id).single()
      .then(({ data }) => {
        if (data) setForm({
          full_name: data.full_name ?? '',
          phone: data.phone ?? '',
          email: data.email ?? '',
          city: data.city ?? '',
          address: data.address ?? '',
          client_type: data.client_type ?? 'persoana_fizica',
          company_name: data.company_name ?? '',
          billing_details: data.billing_details ?? '',
          lead_source: data.lead_source ?? '',
          tags: data.tags ?? [],
          pipeline_status: data.pipeline_status ?? 'lead_nou',
          notes: data.notes ?? '',
        })
      })
  }, [id])

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
    const { error } = await supabase.from('clients').update({
      ...form,
      lead_source: form.lead_source || null,
    }).eq('id', id)

    if (error) { toast.error('Eroare: ' + error.message); setSaving(false); return }
    toast.success('Client actualizat')
    router.push(`/clienti/${id}`)
  }

  const TAGS: ClientTag[] = ['nunta', 'corporate', 'recurent', 'urgent', 'recomandare', 'premium']

  return (
    <div>
      <PageHeader
        title="Editeaza client"
        action={
          <div className="flex gap-2">
            <button onClick={() => router.back()} className="btn btn-secondary">Anuleaza</button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">
              {saving ? 'Se salveaza...' : 'Salveaza modificarile'}
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
              <input className="input" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
            </div>
            <div>
              <label className="label">Telefon *</label>
              <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div>
              <label className="label">Localitate</label>
              <input className="input" value={form.city} onChange={e => set('city', e.target.value)} />
            </div>
            <div>
              <label className="label">Adresa</label>
              <input className="input" value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
            <div>
              <label className="label">Tip client</label>
              <select className="input" value={form.client_type} onChange={e => set('client_type', e.target.value)}>
                <option value="persoana_fizica">Persoana fizica</option>
                <option value="companie">Companie</option>
              </select>
            </div>
            {form.client_type === 'companie' && (
              <div>
                <label className="label">Nume companie</label>
                <input className="input" value={form.company_name} onChange={e => set('company_name', e.target.value)} />
              </div>
            )}
            <div className="col-span-2">
              <label className="label">Date facturare</label>
              <textarea className="input resize-none" rows={2} value={form.billing_details} onChange={e => set('billing_details', e.target.value)} />
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
              <label className="label">Status pipeline</label>
              <select className="input" value={form.pipeline_status} onChange={e => set('pipeline_status', e.target.value)}>
                <option value="lead_nou">Lead nou</option>
                <option value="in_discutie">In discutie</option>
                <option value="oferta_trimisa">Oferta trimisa</option>
                <option value="oferta_acceptata">Oferta acceptata</option>
                <option value="contract_semnat">Contract semnat</option>
                <option value="avans_primit">Avans primit</option>
                <option value="programat">Programat</option>
                <option value="eveniment_realizat">Eveniment realizat</option>
                <option value="editare_in_curs">Editare in curs</option>
                <option value="galerie_livrata">Galerie livrata</option>
                <option value="finalizat">Finalizat</option>
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
          <textarea className="input min-h-[100px] resize-none mt-2" value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Orice informatie utila..." />
        </div>
      </div>
    </div>
  )
}
