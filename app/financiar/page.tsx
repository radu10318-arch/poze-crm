'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Avatar } from '@/components/ui/Avatar'
import { PaymentBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Payment } from '@/types'
import { toast } from 'sonner'
import { CheckCircle } from 'lucide-react'

interface PaymentWithClient extends Payment {
  clients: { full_name: string } | null
}

export default function FinanciarPage() {
  const [payments, setPayments] = useState<PaymentWithClient[]>([])
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('payments')
      .select('*, clients(full_name)')
      .order('created_at', { ascending: false })
      .then(({ data }) => setPayments((data ?? []) as PaymentWithClient[]))
  }, [])

  const total = payments.reduce((s, p) => s + p.total_amount, 0)
  const incasat = payments.reduce((s, p) => s + (p.total_amount - p.remaining_amount), 0)
  const rest = payments.reduce((s, p) => s + p.remaining_amount, 0)
  const today = new Date().toISOString().slice(0, 10)
  const restante = payments.filter(p => p.due_date && p.due_date < today && p.status !== 'achitat')

  async function markPaid(paymentId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    const p = payments.find(x => x.id === paymentId)
    if (!p) return

    await supabase.from('payments').update({
      status: 'achitat',
      remaining_amount: 0,
    }).eq('id', paymentId)

    await supabase.from('payment_records').insert({
      payment_id: paymentId,
      client_id: p.client_id,
      amount: p.remaining_amount,
      method: p.payment_method ?? 'cash',
      paid_at: new Date().toISOString(),
      user_id: user!.id,
    })

    await supabase.from('timeline_entries').insert({
      client_id: p.client_id,
      entry_type: 'plata_finala',
      description: `Plată finală primită · ${formatCurrency(p.remaining_amount)}`,
      user_id: user!.id,
    })

    setPayments(prev => prev.map(x =>
      x.id === paymentId ? { ...x, status: 'achitat', remaining_amount: 0 } : x
    ))
    toast.success('Plată marcată ca achitată')
  }

  return (
    <div>
      <PageHeader title="Financiar" subtitle="Evidența simplă a plăților" />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total contractat" value={formatCurrency(total)} accent />
          <StatCard label="Încasat" value={formatCurrency(incasat)} />
          <StatCard label="Rest de încasat" value={formatCurrency(rest)} danger={rest > 0} />
        </div>

        {restante.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm font-medium text-red-700 mb-1">
              {restante.length} plată(ți) restantă(e) — termen depășit
            </p>
            <p className="text-xs text-red-500">
              {restante.map(p => p.clients?.full_name).join(', ')}
            </p>
          </div>
        )}

        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-stone-400 uppercase tracking-wide">Client</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-stone-400 uppercase tracking-wide hidden sm:table-cell">Total</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-stone-400 uppercase tracking-wide">Rest</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-stone-400 uppercase tracking-wide hidden md:table-cell">Scadent</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-stone-400 uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-stone-400 uppercase tracking-wide">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {payments.map(p => {
                const pct = Math.round(((p.total_amount - p.remaining_amount) / p.total_amount) * 100)
                const overdue = p.due_date && p.due_date < today && p.status !== 'achitat'
                return (
                  <tr key={p.id} className={`table-row-hover ${overdue ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <Link href={`/clienti/${p.client_id}`} className="flex items-center gap-2.5 group">
                        <Avatar name={p.clients?.full_name ?? '?'} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-stone-900 group-hover:text-brand-brown">
                            {p.clients?.full_name}
                          </p>
                          {/* progress */}
                          <div className="w-24 bg-stone-100 rounded-full h-1 mt-1">
                            <div className="bg-brand-gold h-1 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-stone-500 hidden sm:table-cell">
                      {formatCurrency(p.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-medium ${p.remaining_amount > 0 ? 'text-red-600' : 'text-stone-400'}`}>
                        {formatCurrency(p.remaining_amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {p.due_date ? (
                        <span className={`text-xs ${overdue ? 'text-red-600 font-medium' : 'text-stone-500'}`}>
                          {formatDate(p.due_date)}{overdue ? ' · DEPĂȘIT' : ''}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <PaymentBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.status !== 'achitat' && (
                        <button onClick={() => markPaid(p.id)}
                          className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 ml-auto">
                          <CheckCircle size={13} /> Marchează achitat
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
