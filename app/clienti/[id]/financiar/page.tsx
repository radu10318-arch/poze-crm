'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { PageHeader } from '@/components/ui/PageHeader'
import { formatCurrency } from '@/lib/utils'
import type { Payment, PaymentMethod, PaymentStatus } from '@/types'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'

export default function FinanciarClientPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [payment, setPayment] = useState<Payment | null>(null)
  const [saving, setSaving] = useState(false)
  const [clientName, setClientName] = useState('')

  const [totalAmount, setTotalAmount] = useState(0)
  const [advanceAmount, setAdvanceAmount] = useState(0)
  const [advancePaidAt, setAdvancePaidAt] = useState('')
  const [remainingAmount, setRemainingAmount] = useState(0)
  const [dueDate, setDueDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transfer')
  const [status, setStatus] = useState<PaymentStatus>('neplatit')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    supabase.from('clients').select('full_name').eq('id', id).single()
      .then(({ data }) => setClientName(data?.full_name ?? ''))

    supabase.from('payments').select('*').eq('client_id', id)
      .order('created_at').limit(1).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPayment(data as Payment)
          setTotalAmount(data.total_amount)
          setAdvanceAmount(data.advance_amount ?? 0)
          setAdvancePaidAt(data.advance_paid_at ? data.advance_paid_at.slice(0, 10) : '')
          setRemainingAmount(data.remaining_amount)
          setDueDate(data.due_date ?? '')
          setPaymentMethod(data.payment_method ?? 'transfer')
          setStatus(data.status)
          setNotes(data.notes ?? '')
        }
      })
  }, [id])

  // Calculeaza automat restul
  useEffect(() => {
    setRemainingAmount(totalAmount - advanceAmount)
  }, [totalAmount, advanceAmount])

  // Calculeaza statusul automat
  useEffect(() => {
    if (advanceAmount <= 0) setStatus('neplatit')
    else if (remainingAmount <= 0) setStatus('achitat')
    else if (advanceAmount > 0) setStatus('avans_platit')
  }, [advanceAmount, remainingAmount])

  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (payment) {
      await supabase.from('payments').update({
        total_amount: totalAmount,
        advance_amount: advanceAmount,
        advance_paid_at: advancePaidAt || null,
        remaining_amount: remainingAmount,
        due_date: dueDate || null,
        payment_method: paymentMethod,
        status,
        notes,
      }).eq('id', payment.id)
    } else {
      await supabase.from('payments').insert({
        client_id: id,
        total_amount: totalAmount,
        advance_amount: advanceAmount,
        advance_paid_at: advancePaidAt || null,
        remaining_amount: remainingAmount,
        due_date: dueDate || null,
        payment_method: paymentMethod,
        status,
        notes,
        user_id: user!.id,
      })
    }

    // Timeline
    await supabase.from('timeline_entries').insert({
      client_id: id,
      entry_type: 'nota_adaugata',
      description: `Situatie financiara actualizata — ${formatCurrency(advanceAmount)} avans, ${formatCurrency(remainingAmount)} rest`,
      user_id: user!.id,
    })

    toast.success('Situatie financiara salvata!')
    router.push(`/clienti/${id}`)
  }

  return (
    <div>
      <PageHeader
        title={`Financiar — ${clientName}`}
        action={
          <div className="flex gap-2">
            <button onClick={() => router.back()} className="btn btn-secondary">Anuleaza</button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">
              {saving ? 'Se salveaza...' : 'Salveaza'}
            </button>
          </div>
        }
      />
      <div className="p-4 md:p-6 max-w-xl space-y-5">
        <div className="card space-y-4">
          <p className="section-title">Sume</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Total contract (lei)</label>
              <input type="number" className="input" value={totalAmount || ''}
                onChange={e => setTotalAmount(Number(e.target.value))} placeholder="0" />
            </div>
            <div>
              <label className="label">Avans primit (lei)</label>
              <input type="number" className="input" value={advanceAmount || ''}
                onChange={e => setAdvanceAmount(Number(e.target.value))} placeholder="0" />
            </div>
            <div>
              <label className="label">Data avans primit</label>
              <input type="date" className="input" value={advancePaidAt}
                onChange={e => setAdvancePaidAt(e.target.value)} />
            </div>
            <div>
              <label className="label">Scadenta rest</label>
              <input type="date" className="input" value={dueDate}
                onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="bg-brand-cream rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-stone-600">Total contract</span>
              <span className="font-medium">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-600">Avans primit</span>
              <span className="text-green-600 font-medium">{formatCurrency(advanceAmount)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-stone-200 pt-2 mt-2">
              <span className="text-stone-600">Rest de plata</span>
              <span className={`font-semibold ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(remainingAmount)}
              </span>
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <p className="section-title">Detalii plata</p>
          <div>
            <label className="label">Metoda de plata</label>
            <select className="input" value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}>
              <option value="transfer">Transfer bancar</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="alta">Alta</option>
            </select>
          </div>
          <div>
            <label className="label">Status plata</label>
            <select className="input" value={status}
              onChange={e => setStatus(e.target.value as PaymentStatus)}>
              <option value="neplatit">Neplatit</option>
              <option value="avans_platit">Avans platit</option>
              <option value="partial">Partial</option>
              <option value="achitat">Achitat integral</option>
            </select>
          </div>
          <div>
            <label className="label">Note</label>
            <textarea className="input resize-none" rows={2} value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: avans platit cash la intalnire..." />
          </div>
        </div>
      </div>
    </div>
  )
}
