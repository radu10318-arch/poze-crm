'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { PageHeader } from '@/components/ui/PageHeader'
import { formatDate, SERVICE_TYPE_LABELS } from '@/lib/utils'
import Link from 'next/link'
import { MapPin, Clock, Users } from 'lucide-react'

interface EventWithClient {
  id: string
  date: string
  start_time: string
  end_time?: string
  event_type: string
  location_primary: string
  estimated_persons?: number
  status: string
  client_id: string
  clients: { full_name: string } | null
}

export default function CalendarPage() {
  const [events, setEvents] = useState<EventWithClient[]>([])
  const supabase = createClient()

  useEffect(() => {
    supabase.from('events').select('*, clients(full_name)')
      .order('date', { ascending: true })
      .then(({ data }) => setEvents((data ?? []) as EventWithClient[]))
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const viitoare = events.filter(e => e.date >= today)
  const trecute = events.filter(e => e.date < today)

  return (
    <div>
      <PageHeader title="Calendar" subtitle="Evenimente programate" />
      <div className="p-6 space-y-6">
        {!events.length && (
          <div className="card text-center py-12">
            <p className="text-stone-400 text-sm">Niciun eveniment programat.</p>
            <p className="text-stone-300 text-xs mt-1">Evenimentele apar automat cand adaugi un client cu eveniment.</p>
          </div>
        )}

        {viitoare.length > 0 && (
          <div>
            <p className="section-title mb-3">Evenimente viitoare</p>
            <div className="space-y-3">
              {viitoare.map(ev => (
                <Link key={ev.id} href={`/clienti/${ev.client_id}`}>
                  <div className="card hover:border-brand-gold/40 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-stone-900">{ev.clients?.full_name}</p>
                        <p className="text-sm text-stone-500 mt-0.5">
                          {SERVICE_TYPE_LABELS[ev.event_type as keyof typeof SERVICE_TYPE_LABELS] ?? ev.event_type}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-brand-brown">{formatDate(ev.date)}</p>
                        <span className={`badge mt-1 ${
                          ev.status === 'programat' ? 'bg-amber-50 text-amber-700' :
                          ev.status === 'realizat' ? 'bg-green-50 text-green-700' :
                          'bg-red-50 text-red-700'
                        }`}>{ev.status}</span>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-3 text-xs text-stone-400">
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {ev.start_time}{ev.end_time ? ` — ${ev.end_time}` : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={11} /> {ev.location_primary}
                      </span>
                      {ev.estimated_persons && (
                        <span className="flex items-center gap-1">
                          <Users size={11} /> {ev.estimated_persons} pers.
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {trecute.length > 0 && (
          <div>
            <p className="section-title mb-3">Evenimente trecute</p>
            <div className="space-y-2 opacity-60">
              {trecute.map(ev => (
                <Link key={ev.id} href={`/clienti/${ev.client_id}`}>
                  <div className="card hover:border-stone-300 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-stone-700">{ev.clients?.full_name}</p>
                        <p className="text-xs text-stone-400">{SERVICE_TYPE_LABELS[ev.event_type as keyof typeof SERVICE_TYPE_LABELS] ?? ev.event_type} · {ev.location_primary}</p>
                      </div>
                      <p className="text-xs text-stone-400">{formatDate(ev.date)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
