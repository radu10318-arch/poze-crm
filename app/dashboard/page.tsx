import { createServerSupabase } from '@/lib/supabase-server'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Avatar } from '@/components/ui/Avatar'
import { PipelineBadge, PaymentBadge, GalleryBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import Link from 'next/link'
import { AlertCircle, ArrowRight } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const uid = user.id

  // Parallel fetch
  const [
    { data: clients },
    { data: events },
    { data: payments },
    { data: galleries },
    { data: offers },
  ] = await Promise.all([
    supabase.from('clients').select('*').eq('user_id', uid),
    supabase.from('events').select('*, clients(full_name)').eq('user_id', uid)
      .gte('date', new Date().toISOString().slice(0, 10))
      .order('date', { ascending: true }).limit(5),
    supabase.from('payments').select('*, clients(full_name)').eq('user_id', uid)
      .neq('status', 'achitat'),
    supabase.from('pixieset_links').select('*, clients(full_name)').eq('user_id', uid)
      .neq('status', 'livrata'),
    supabase.from('offers').select('*').eq('user_id', uid).eq('status', 'trimisa'),
  ])

  const activeClients = (clients ?? []).filter(c =>
    !['finalizat', 'lead_nou'].includes(c.pipeline_status)
  )
  const leadNoi = (clients ?? []).filter(c => c.pipeline_status === 'lead_nou')

  const venitEstimat = (payments ?? []).reduce((s, p) => s + (p.total_amount ?? 0), 0)
  const venitIncasat = (payments ?? []).reduce((s, p) => {
    return s + ((p.total_amount ?? 0) - (p.remaining_amount ?? 0))
  }, 0)

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={new Intl.DateTimeFormat('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
        action={
          <Link href="/oferte/nou" className="btn btn-primary">
            + Ofertă nouă
          </Link>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Venit estimat" value={formatCurrency(venitEstimat)} sub="luna curentă" accent />
          <StatCard label="Venit încasat" value={formatCurrency(venitIncasat)} sub={`din ${formatCurrency(venitEstimat)}`} />
          <StatCard label="Clienți activi" value={activeClients.length} sub={`${leadNoi.length} lead-uri noi`} />
          <StatCard label="Galerii de livrat" value={(galleries ?? []).length} sub="nelivrate sau în editare" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Upcoming events */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Evenimente viitoare</h2>
              <Link href="/calendar" className="text-xs text-brand-gold hover:underline">
                Vezi calendar →
              </Link>
            </div>
            {!events?.length && (
              <p className="text-sm text-stone-400">Niciun eveniment programat.</p>
            )}
            <div className="space-y-3">
              {events?.map(ev => (
                <div key={ev.id} className="flex items-center gap-3">
                  <div className="w-14 text-center flex-shrink-0">
                    <div className="text-xs text-stone-400">{formatDateShort(ev.date)}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">
                      {(ev.clients as { full_name: string } | null)?.full_name}
                    </p>
                    <p className="text-xs text-stone-400">{ev.event_type} · {ev.location_primary}</p>
                  </div>
                  <PipelineBadge status="programat" />
                </div>
              ))}
            </div>
          </div>

          {/* Plăți restante */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title flex items-center gap-1.5">
                {(payments ?? []).length > 0 && (
                  <AlertCircle size={13} className="text-red-500" />
                )}
                Plăți restante
              </h2>
              <Link href="/financiar" className="text-xs text-brand-gold hover:underline">
                Vezi tot →
              </Link>
            </div>
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
                      <p className="text-xs text-stone-400">
                        scadent {formatDateShort(p.due_date)}
                        {p.due_date < today && ' · DEPĂȘIT'}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-600">
                      {formatCurrency(p.remaining_amount)}
                    </p>
                    <PaymentBadge status={p.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lead-uri noi + Galerii */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Lead-uri noi</h2>
              <Link href="/clienti" className="text-xs text-brand-gold hover:underline">
                Toți clienții →
              </Link>
            </div>
            {!leadNoi.length && <p className="text-sm text-stone-400">Niciun lead nou.</p>}
            <div className="space-y-2">
              {leadNoi.slice(0, 4).map(c => (
                <Link key={c.id} href={`/clienti/${c.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50 transition-colors group">
                  <Avatar name={c.full_name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">{c.full_name}</p>
                    <p className="text-xs text-stone-400">{c.lead_source ?? 'Sursă necunoscută'}</p>
                  </div>
                  <ArrowRight size={14} className="text-stone-300 group-hover:text-brand-gold transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Galerii de livrat</h2>
            </div>
            {!galleries?.length && <p className="text-sm text-stone-400">Nicio galerie de livrat.</p>}
            <div className="space-y-2">
              {galleries?.map(g => (
                <div key={g.id} className="flex items-center gap-3 p-2 rounded-lg">
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
        </div>

        {/* Oferte în așteptare */}
        {(offers?.length ?? 0) > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Oferte trimise — în așteptare</h2>
              <Link href="/oferte" className="text-xs text-brand-gold hover:underline">
                Toate ofertele →
              </Link>
            </div>
            <div className="space-y-2">
              {offers?.map(o => (
                <Link key={o.id} href={`/oferte/${o.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-stone-100 hover:border-brand-gold/30 transition-colors">
                  <div className="flex-1 text-sm text-stone-700">{o.service_type}</div>
                  <div className="text-sm font-medium">{formatCurrency(o.total_price)}</div>
                  <ArrowRight size={14} className="text-stone-300" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
