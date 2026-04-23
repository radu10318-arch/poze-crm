import { createServerSupabase } from '@/lib/supabase-server'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Avatar } from '@/components/ui/Avatar'
import { PipelineBadge, PaymentBadge, GalleryBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDateShort, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { AlertCircle, MapPin, Clock } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const uid = user.id

  const [
    { data: clients },
    { data: events },
    { data: payments },
    { data: galleries },
  ] = await Promise.all([
    supabase.from('clients').select('*').eq('user_id', uid),
    supabase.from('events').select('*, clients(full_name)').eq('user_id', uid)
      .gte('date', new Date().toISOString().slice(0, 10))
      .order('date', { ascending: true }).limit(5),
    supabase.from('payments').select('*, clients(full_name)').eq('user_id', uid)
      .neq('status', 'achitat'),
    supabase.from('pixieset_links').select('*, clients(full_name)').eq('user_id', uid)
      .neq('status', 'livrata'),
  ])

  const activeClients = (clients ?? []).filter(c =>
    !['finalizat', 'lead_nou'].includes(c.pipeline_status)
  )

  const venitEstimat = (payments ?? []).reduce((s, p) => s + (p.total_amount ?? 0), 0)
  const venitIncasat = (payments ?? []).reduce((s, p) => s + ((p.total_amount ?? 0) - (p.remaining_amount ?? 0)), 0)
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={new Intl.DateTimeFormat('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
        action={
          <Link href="/oferte/nou" className="btn btn-primary">+ Ofertă nouă</Link>
        }
      />

      <div className="p-4 md:p-6 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Venit estimat" value={formatCurrency(venitEstimat)} sub="de încasat" accent />
          <StatCard label="Venit încasat" value={formatCurrency(venitIncasat)} />
          <StatCard label="Clienți activi" value={activeClients.length} />
          <StatCard label="Galerii de livrat" value={(galleries ?? []).length} />
        </div>

        {/* Evenimente viitoare */}
        <Link href="/calendar" className="card block hover:border-brand-gold/40 transition-colors">
          <h2 className="section-title mb-3">Evenimente viitoare</h2>
          {!events?.length && (
            <p className="text-sm text-stone-400">Niciun eveniment programat.</p>
          )}
          <div className="space-y-3">
            {events?.map(ev => (
              <div key={ev.id} className="flex items-start gap-3">
                <div className="w-12 text-center flex-shrink-0 bg-brand-cream rounded-lg py-1.5">
                  <div className="text-xs text-stone-500">{new Intl.DateTimeFormat('ro-RO', { month: 'short' }).format(new Date(ev.date))}</div>
                  <div className="text-lg font-semibold text-brand-brown leading-none">{new Date(ev.date).getDate()}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-900 truncate">
                    {(ev.clients as { full_name: string } | null)?.full_name}
                  </p>
                  <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={10} /> {ev.location_primary}
                  </p>
                  {ev.start_time && (
                    <p className="text-xs text-stone-400 flex items-center gap-1">
                      <Clock size={10} /> {ev.start_time}{ev.end_time ? ` — ${ev.end_time}` : ''}
                    </p>
                  )}
                </div>
                <span className="text-xs text-stone-400 flex-shrink-0">{ev.event_type}</span>
              </div>
            ))}
          </div>
        </Link>

        {/* Plati restante */}
        <Link href="/financiar" className="card block hover:border-brand-gold/40 transition-colors">
          <h2 className="section-title mb-3 flex items-center gap-1.5">
            {(payments ?? []).length > 0 && <AlertCircle size={13} className="text-red-500" />}
            Plăți restante
          </h2>
          {!payments?.length && (
            <p className="text-sm text-stone-400">Nicio plată restantă.</p>
          )}
          <div className="space-y-3">
            {payments?.slice(0, 4).map(p => (
              <div key={p.id} className="flex items-center gap-3">
                <Avatar name={(p.clients as { full_name: string } | null)?.full_name ?? '?'} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-900 truncate">
                    {(p.clients as { full_name: string } | null)?.full_name}
                  </p>
                  {p.due_date && (
                    <p className={`text-xs ${p.due_date < today ? 'text-red-500' : 'text-stone-400'}`}>
                      scadent {formatDateShort(p.due_date)}
                      {p.due_date < today && ' · DEPĂȘIT'}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-red-600">{formatCurrency(p.remaining_amount)}</p>
                  <PaymentBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        </Link>

        {/* Galerii de livrat */}
        {(galleries ?? []).length > 0 && (
          <div className="card">
            <h2 className="section-title mb-3">Galerii de livrat</h2>
            <div className="space-y-2">
              {galleries?.map(g => (
                <div key={g.id} className="flex items-center gap-3">
                  <Avatar name={(g.clients as { full_name: string } | null)?.full_name ?? '?'} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">
                      {(g.clients as { full_name: string } | null)?.full_name}
                    </p>
                    {g.delivery_date && (
                      <p className="text-xs text-stone-400">termen {formatDateShort(g.delivery_date)}</p>
                    )}
                  </div>
                  <GalleryBadge status={g.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
