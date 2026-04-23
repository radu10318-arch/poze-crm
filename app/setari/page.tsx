'use client'

import { PageHeader } from '@/components/ui/PageHeader'
import { Camera } from 'lucide-react'

export default function SetariPage() {
  return (
    <div>
      <PageHeader title="Setari" subtitle="Configurare cont si business" />
      <div className="p-6 max-w-xl space-y-5">
        <div className="card space-y-4">
          <p className="section-title">Profil business</p>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-xl bg-brand-brown flex items-center justify-center">
              <Camera size={22} className="text-brand-cream" />
            </div>
            <div>
              <p className="font-medium text-stone-900">Poze'N Cui</p>
              <p className="text-sm text-stone-400">pozeincui.ro</p>
            </div>
          </div>
          <div>
            <label className="label">Nume business</label>
            <input className="input" defaultValue="Poze'N Cui" />
          </div>
          <div>
            <label className="label">Website</label>
            <input className="input" defaultValue="pozeincui.ro" />
          </div>
          <div>
            <label className="label">Telefon business</label>
            <input className="input" placeholder="+40 7xx xxx xxx" />
          </div>
          <div>
            <label className="label">Oras</label>
            <input className="input" defaultValue="Brasov" />
          </div>
          <button className="btn btn-primary">Salveaza</button>
        </div>

        <div className="card space-y-4">
          <p className="section-title">Cont</p>
          <div>
            <label className="label">Email cont</label>
            <input className="input" defaultValue="radu10318@gmail.com" disabled />
          </div>
          <div>
            <label className="label">Parola noua</label>
            <input type="password" className="input" placeholder="••••••••" />
          </div>
          <button className="btn btn-secondary">Schimba parola</button>
        </div>

        <div className="card">
          <p className="section-title">Despre</p>
          <p className="text-sm text-stone-500 mt-2">Poze'N Cui CRM v1.0</p>
          <p className="text-xs text-stone-400 mt-1">Construit cu Next.js + Supabase</p>
        </div>
      </div>
    </div>
  )
}
