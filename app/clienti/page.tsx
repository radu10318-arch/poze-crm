'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { PipelineBadge } from '@/components/ui/Badge'
import { formatCurrency, LEAD_SOURCE_LABELS, SERVICE_TYPE_LABELS } from '@/lib/utils'
import { createClient } from '@/lib/supabase'
import type { Client } from '@/types'
import { Search, Filter, Phone, Mail } from 'lucide-react'

const PIPELINE_TABS = [
  { label: 'Toți', value: '' },
  { label: 'Lead-uri', value: 'lead_nou' },
  { label: 'Activi', value: 'activi' },
  { label: 'Finalizați', value: 'finalizat' },
]

export default function ClientiPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      let query = supabase.from('clients').select('*').order('created_at', { ascending: false })
      if (tab === 'activi') {
        query = query.not('pipeline_status', 'in', '("lead_nou","finalizat")')
      } else if (tab) {
        query = query.eq('pipeline_status', tab)
      }
      const { data } = await query
      setClients(data ?? [])
    }
    load()
  }, [tab])

  const filtered = clients.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PageHeader
        title="Clienți"
        subtitle={`${clients.length} înregistrați`}
        action={
          <Link href="/clienti/nou" className="btn btn-primary">+ Client nou</Link>
        }
      />

      <div className="p-6">
        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex gap-1 bg-stone-100 p-1 rounded-lg">
            {PIPELINE_TABS.map(t => (
              <button key={t.value}
                onClick={() => setTab(t.value)}
                className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                  tab === t.value
                    ? 'bg-white text-stone-900 shadow-sm font-medium'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              className="input pl-8"
              placeholder="Caută după nume, telefon, email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-stone-400 uppercase tracking-wide">Client</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-stone-400 uppercase tracking-wide hidden md:table-cell">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-stone-400 uppercase tracking-wide hidden lg:table-cell">Sursă</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-stone-400 uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-stone-400 uppercase tracking-wide hidden sm:table-cell">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-stone-400 text-sm">
                    Niciun client găsit.
                  </td>
                </tr>
              )}
              {filtered.map(client => (
                <tr key={client.id} className="table-row-hover">
                  <td className="px-4 py-3">
                    <Link href={`/clienti/${client.id}`} className="flex items-center gap-3 group">
                      <Avatar name={client.full_name} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-stone-900 group-hover:text-brand-brown">
                          {client.full_name}
                        </p>
                        <p className="text-xs text-stone-400">{client.city}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-col gap-1">
                      <a href={`tel:${client.phone}`}
                        className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-brand-brown">
                        <Phone size={11} /> {client.phone}
                      </a>
                      {client.email && (
                        <a href={`mailto:${client.email}`}
                          className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-brand-brown">
                          <Mail size={11} /> {client.email}
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-stone-500">
                      {client.lead_source ? LEAD_SOURCE_LABELS[client.lead_source] : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <PipelineBadge status={client.pipeline_status} />
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-right">
                    <Link href={`/clienti/${client.id}`}
                      className="text-xs text-brand-gold hover:underline">
                      Profil →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
