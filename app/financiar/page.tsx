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
import { CheckCircle, Trash2, ArrowUpDown } from 'lucide-react'

interface PaymentWithClient extends Payment {
  clients: { full_name: string } | null
}

type SortOption = 'nou' | 'vechi' | 'suma_desc' | 'suma_asc' | 'restant'

export default function FinanciarPage() {
  const [payments, setPayments] = useState<PaymentWithClient[]>([])
  const [sort, setSort] = useState<SortOption>('nou')
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('payments')
      .select('*, clients(full_name)')
      .order('created_at', { ascending: false })
      .then(({ data }) => setPayments((data ?? []) as PaymentWithClient[]))
  }, [])

  const sorted = [...payments].sort((a, b) => {
    if (sort === 'nou') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (sort === 'vechi') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    if (sort === 'suma_desc') return b.total_amount - a.total_amount
    if (sort === 'suma_asc') return a.total_amount - b.total_amount
    if (sort === 'restant') return b.remaining_amount - a.remaining_amount
    return 0
  })

  const total = payments.reduce((s, p) => s + p.total_amount, 0)
  const incasat = payments.reduce((s, p) => s + (p.total_amount - p.remaining_amount), 0)
  const rest = payments.reduce((s, p) => s + p.remaining_amount, 0)
  const today = new Date().toISOString().slice(0, 10)

  async function markPaid(paymentId: string) {
    const p = payments.find(x => x.id === paymentId)
    if (!p) return
    const { data: { user } } = await supabase.auth.getUser()

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
      description: `Plata finala primita · ${formatCurrency(p.remaining_amount)}`,
      user_id: user!.id,
    })

    setPayments(prev => prev.map(x =>
      x.id === paymentId ? { ...x, status: 'achitat', remaining_amount: 0 } : x
    ))
    toast.success('Plata marcata ca achitata')
  }

  async function deletePayment(paymentId: string) {
    if (!confirm('Stergi aceasta inregistrare financiara?')) return
    await supabase.from('payments').delete().eq('id', paymentId)
    setPayments(prev => prev.filter(p => p.id !== paymentId))
    toast.success('Inregistrare stearsa')
  }

  return (
    <div>
      <PageHeader title="Financiar" subtitle="Evidenta platilor" />

      <div className="p-4 md:p-6 space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total contractat" value={formatCurrency(total)} accent />
          <StatCard label="Incasat" value={formatCurrency(incasat)} />
          <StatCard label="Rest" value={formatCurrency(rest)} danger={rest > 0} />
        </div>

        {/* Sortare */}
        <div className="flex items-center gap-2 flex-wrap">
          <ArrowUpDown size={14} className="text-stone-400" />
          <span className="text-xs text-stone-400">Sorteaza:</span>
          {([
            ['nou', 'Cel mai nou'],
            ['vechi', 'Cel mai vechi'],
            ['suma_desc', 'Suma mare'],
            ['suma_asc', 'Suma mica'],
            ['restant', 'Rest mare'],
          ] as [SortOption, string][]).map(([val, label]) => (
            <button key={val} onClick={() => setSort(val)}
              className={`px-3 py-1 rounded-full text-xs border transition-all ${
                sort === val
                  ? 'bg-brand-brown text-brand-cream border-brand-brown'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-stone-400 uppercase tracking-wide">Client</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-stone-400 uppercase tracking-wide hidden sm:table-cell">Total</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-stone-400 uppercase tracking-wide">Rest</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-stone-400 uppercase tracking-wide hidden md:table-cell">Scadent</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-stone-400 uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-stone-400 uppercase tracking-wide">Actiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {!sorted.length && (
                <tr><td colSpan={6} className="text-center py-12 text-stone-400 text-sm">Nicio inregistrare.</td></tr>
              )}
              {sorted.map(p => {
                const pct = p.total_amount > 0 ? Math.round(((p.total_amount - p.remaining_amount) / p.total_amount) * 100) : 0
                const overdue = p.due_date && p.due_date < today && p.status !== 'achitat'
                return (
                  <tr key={p.id} className={`table-row-hover ${overdue ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <Link href={`/clienti/${p.client_id}`} className="flex items-center gap-2.5 group">
                        <Avatar name={p.clients?.full_name ?? '?'} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-stone-900 group-hover:text-brand-brown truncate max-w-[120px]">
                            {p.clients?.full_name}
                          </p>
                          <div className="w-20 bg-stone-100 rounded-full h-1 mt-1">
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
                          {formatDate(p.due_date)}{overdue ? ' · DEPASIT' : ''}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <PaymentBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {p.status !== 'achitat' && (
                          <button onClick={() => markPaid(p.id)}
                            className="text-green-600 hover:text-green-700">
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button onClick={() => deletePayment(p.id)}
                          className="text-stone-300 hover:text-red-500 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
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
