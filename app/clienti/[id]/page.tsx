'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { PageHeader } from '@/components/ui/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { PipelineBadge, PaymentBadge, GalleryBadge } from '@/components/ui/Badge'
import { Timeline } from '@/components/ui/Timeline'
import {
  formatCurrency, formatDate, formatDateShort,
  PIPELINE_LABELS, PIPELINE_ORDER, LEAD_SOURCE_LABELS,
  SERVICE_TYPE_LABELS
} from '@/lib/utils'
import type { Client, Event, Payment, PixiesetLink, Document, TimelineEntry, Task } from '@/types'
import {
  Phone, Mail, MapPin, ExternalLink, FileText,
  ChevronRight, Plus, Check, Edit2, Trash2, Calendar
} from 'lucide-react'
import { toast } from 'sonner'

type TabId = 'overview' | 'timeline' | 'documente' | 'taskuri'

export default function ClientProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [client, setClient] = useState<Client | null>(null)
  const [event, setEvent] = useState<Event | null>(null)
  const [payment, setPayment] = useState<Payment | null>(null)
  const [gallery, setGallery] = useState<PixiesetLink | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [tab, setTab] = useState<TabId>('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    async function load() {
      const [
        { data: c },
        { data: ev },
        { data: pay },
        { data: gal },
        { data: docs },
        { data: tl },
        { data: tk },
      ] = await Promise.all([
        supabase.from('clients').select('*').eq('id', id).single(),
        supabase.from('events').select('*').eq('client_id', id).order('date').limit(1).maybeSingle(),
        supabase.from('payments').select('*').eq('client_id', id).order('created_at').limit(1).maybeSingle(),
        supabase.from('pixieset_links').select('*').eq('client_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('documents').select('*').eq('client_id', id).order('uploaded_at', { ascending: false }),
        supabase.from('timeline_entries').select('*').eq('client_id', id).order('created_at', { ascending: false }),
        supabase.from('tasks').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      ])
      setClient(c)
      setEvent(ev ?? null)
      setPayment(pay ?? null)
      setGallery(gal ?? null)
      setDocuments(docs ?? [])
      setTimeline(tl ?? [])
      setTasks(tk ?? [])
      setLoading(false)
    }
    load()
  }, [id])

  async function updatePipeline(status: string) {
    const { error } = await supabase
      .from('clients')
      .update({ pipeline_status: status })
      .eq('id', id)
    if (error) { toast.error('Eroare la actualizare'); return }
    // Add timeline entry
    await supabase.from('timeline_entries').insert({
      client_id: id,
      entry_type: 'pipeline_schimbat',
      description: `Status schimbat -> ${PIPELINE_LABELS[status as keyof typeof PIPELINE_LABELS]}`,
      metadata: { to: status },
      user_id: (await supabase.auth.getUser()).data.user!.id,
    })
    setClient(prev => prev ? { ...prev, pipeline_status: status as Client['pipeline_status'] } : null)
    toast.success('Status actualizat')
  }

  async function toggleTask(taskId: string, completed: boolean) {
    await supabase.from('tasks').update({ completed }).eq('id', taskId)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed } : t))
  }

  async function deleteClient() {
    if (!confirm(`Ștergi definitiv clientul "${client?.full_name}"?`)) return
    await supabase.from('clients').delete().eq('id', id)
    router.push('/clienti')
    toast.success('Client șters')
  }

  if (loading) return <div className="p-10 text-stone-400 text-sm">Se încarcă...</div>
  if (!client) return <div className="p-10 text-stone-400 text-sm">Client negăsit.</div>

  const pipelineIdx = PIPELINE_ORDER.indexOf(client.pipeline_status)

  return (
    <div>
      <PageHeader
        title={client.full_name}
        subtitle={client.city ?? ''}
        action={
          <div className="flex gap-2">
            <Link href={`/clienti/${id}/edit`} className="btn btn-secondary">
              <Edit2 size={14} /> Editează
            </Link>
            <Link href={`/clienti/${id}/eveniment-nou`} className="btn btn-secondary"><Calendar size={14} /> Eveniment</Link>
            <Link href={`/oferte/nou?client=${id}`} className="btn btn-primary">
              <Plus size={14} /> Ofertă
            </Link>
          </div>
        }
      />

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT SIDEBAR */}
        <div className="space-y-4">
          {/* Profile card */}
          <div className="card">
            <div className="flex items-start gap-3 mb-4">
              <Avatar name={client.full_name} size="lg" />
              <div>
                <h2 className="font-semibold text-stone-900">{client.full_name}</h2>
                <PipelineBadge status={client.pipeline_status} />
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-stone-700">
                <Phone size={14} className="text-stone-400" />
                {client.phone}
              </div>
              {client.email && (
                <a href={`mailto:${client.email}`}
                  className="flex items-center gap-2 text-stone-700">
                  <Mail size={14} className="text-stone-400" />
                  {client.email}
                </a>
              )}
              {client.city && (
                <div className="flex items-center gap-2 text-stone-500">
                  <MapPin size={14} className="text-stone-400" />
                  {client.city}
                </div>
              )}
            </div>

            {client.lead_source && (
              <div className="mt-4 pt-4 border-t border-stone-100">
                <p className="label">Sursă lead</p>
                <p className="text-sm text-stone-700">{LEAD_SOURCE_LABELS[client.lead_source]}</p>
              </div>
            )}

            {client.tags && client.tags.length > 0 && (
              <div className="mt-3">
                <p className="label">Etichete</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {client.tags.map(tag => (
                    <span key={tag} className="badge bg-stone-100 text-stone-600">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Financial summary */}
          {payment && (
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <p className="section-title mb-0">Situatie financiara</p>
                <Link href={`/clienti/${id}/financiar`} className="text-xs text-brand-gold hover:underline">Editeaza</Link>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Total</span>
                  <span className="font-medium">{formatCurrency(payment.total_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Încasat</span>
                  <span className="text-green-600 font-medium">
                    {formatCurrency(payment.total_amount - payment.remaining_amount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Rest</span>
                  <span className={payment.remaining_amount > 0 ? 'text-red-600 font-medium' : 'text-stone-500'}>
                    {formatCurrency(payment.remaining_amount)}
                  </span>
                </div>
                {/* Progress */}
                <div className="w-full bg-stone-100 rounded-full h-1.5 mt-2">
                  <div
                    className="bg-brand-gold h-1.5 rounded-full"
                    style={{ width: `${Math.round(((payment.total_amount - payment.remaining_amount) / payment.total_amount) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="mt-3">
                <PaymentBadge status={payment.status} />
              </div>
              {payment.due_date && (
                <p className="text-xs text-stone-400 mt-2">Scadent: {formatDate(payment.due_date)}</p>
              )}
            </div>
          )}

          {/* Gallery */}
          {gallery && (
            <div className="card">
              <p className="section-title">Galerie Pixieset</p>
              <div className="flex items-center justify-between mb-2">
                <GalleryBadge status={gallery.status} />
                <a href={gallery.link_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-brand-gold hover:underline">
                  Deschide <ExternalLink size={11} />
                </a>
              </div>
              {gallery.delivery_date && (
                <p className="text-xs text-stone-400">
                  {gallery.status === 'livrata' ? 'Livrat' : 'Deadline'}: {formatDate(gallery.delivery_date)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* MAIN CONTENT */}
        <div className="lg:col-span-2 space-y-4">
          {/* Pipeline progress */}
          <div className="card">
            <p className="section-title mb-3">Pipeline</p>
            <div className="flex gap-1 flex-wrap">
              {PIPELINE_ORDER.map((status, i) => (
                <button
                  key={status}
                  onClick={() => updatePipeline(status)}
                  className={`text-xs px-2.5 py-1 rounded-full transition-all border ${
                    i === pipelineIdx
                      ? 'bg-brand-brown text-brand-cream border-brand-brown font-medium'
                      : i < pipelineIdx
                      ? 'bg-stone-100 text-stone-400 border-stone-100'
                      : 'bg-white text-stone-500 border-stone-200 hover:border-brand-gold/50'
                  }`}
                >
                  {PIPELINE_LABELS[status]}
                </button>
              ))}
            </div>
          </div>

          {/* Event */}
          {event && (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <p className="section-title">Eveniment · {formatDate(event.date)}</p>
                <div className="flex gap-2">
                  <Link href={`/clienti/${id}/eveniment-nou`} className="text-xs text-brand-gold hover:underline">
                    Editeaza
                  </Link>
                  <button onClick={async () => {
                    if (!confirm('Stergi evenimentul?')) return
                    await supabase.from('events').delete().eq('client_id', id)
                    setEvent(null)
                    toast.success('Eveniment sters')
                  }} className="text-xs text-red-400 hover:text-red-600">
                    Sterge
                  </button>
                </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="label">Tip</p>
                  <p>{SERVICE_TYPE_LABELS[event.event_type as keyof typeof SERVICE_TYPE_LABELS] ?? event.event_type}</p>
                </div>
                <div>
                  <p className="label">Orar</p>
                  <p>{event.start_time}{event.end_time ? ` — ${event.end_time}` : ''}</p>
                </div>
                <div>
                  <p className="label">Locație principală</p>
                  <p>{event.location_primary}</p>
                </div>
                {event.location_secondary && (
                  <div>
                    <p className="label">Locație secundară</p>
                    <p>{event.location_secondary}</p>
                  </div>
                )}
                {event.estimated_persons && (
                  <div>
                    <p className="label">Persoane estimate</p>
                    <p>{event.estimated_persons}</p>
                  </div>
                )}
                {event.contact_person && (
                  <div>
                    <p className="label">Persoana de contact</p>
                    <p>{event.contact_person}
                      {event.contact_phone && (
                        <span className="text-brand-gold ml-1">
                          · {event.contact_phone}
                        </span>
                      )}
                    </p>
                  </div>
                )}
                {event.special_requirements && (
                  <div className="col-span-2">
                    <p className="label">Cerințe speciale</p>
                    <p className="text-stone-600">{event.special_requirements}</p>
                  </div>
                )}
                {event.delivery_deadline && (
                  <div>
                    <p className="label">Deadline livrare</p>
                    <p className="text-amber-700 font-medium">{formatDate(event.delivery_deadline)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div>
            <div className="flex gap-0 border-b border-stone-200 mb-4">
              {([
                ['overview', 'Detalii'],
                ['timeline', 'Timeline'],
                ['documente', 'Documente'],
                ['taskuri', 'Task-uri'],
              ] as [TabId, string][]).map(([t, label]) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${
                    tab === t
                      ? 'border-brand-gold text-brand-brown font-medium'
                      : 'border-transparent text-stone-500 hover:text-stone-700'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            {tab === 'timeline' && (
              <div className="card">
                <Timeline entries={timeline} />
              </div>
            )}

            {tab === 'overview' && client.notes && (
              <div className="card">
                <p className="section-title">Note interne</p>
                <p className="text-sm text-stone-700 whitespace-pre-line">{client.notes}</p>
              </div>
            )}

            {tab === 'documente' && (
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <p className="section-title">Documente</p>
                </div>
                {!documents.length && (
                  <p className="text-sm text-stone-400">Niciun document atașat.</p>
                )}
                <div className="space-y-2">
                  {documents.map(doc => (
                    <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-stone-100 hover:border-brand-gold/30 transition-colors">
                      <FileText size={16} className="text-stone-400" />
                      <span className="flex-1 text-sm text-stone-700">{doc.file_name}</span>
                      <span className="text-xs text-stone-400">{formatDateShort(doc.uploaded_at)}</span>
                      <ExternalLink size={12} className="text-stone-300" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {tab === 'taskuri' && (
              <div className="card">
                <p className="section-title">Task-uri</p>
                {!tasks.length && <p className="text-sm text-stone-400">Niciun task.</p>}
                <div className="space-y-2">
                  {tasks.map(task => (
                    <div key={task.id}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${
                        task.completed ? 'border-stone-100 opacity-50' : 'border-stone-200'
                      }`}>
                      <button onClick={() => toggleTask(task.id, !task.completed)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          task.completed
                            ? 'bg-green-500 border-green-500'
                            : 'border-stone-300 hover:border-brand-gold'
                        }`}>
                        {task.completed && <Check size={11} className="text-white" />}
                      </button>
                      <span className={`flex-1 text-sm ${task.completed ? 'line-through text-stone-400' : 'text-stone-700'}`}>
                        {task.title}
                      </span>
                      {task.due_date && (
                        <span className="text-xs text-stone-400">{formatDateShort(task.due_date)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Danger zone */}
          <div className="flex justify-end">
            <button onClick={deleteClient}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors">
              <Trash2 size={12} /> Șterge client
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
