'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Camera, Calendar, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SetariContent() {
  const [calendarConnected, setCalendarConnected] = useState(false)
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    if (success === 'calendar_connected') toast.success('Google Calendar conectat!')
    if (error) toast.error('Eroare la conectare Google Calendar')

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('google_access_token')
        .eq('id', user.id)
        .single()
      setCalendarConnected(!!data?.google_access_token)
    })
  }, [])

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
          <button className="btn btn-primary">Salveaza</button>
        </div>

        <div className="card space-y-4">
          <p className="section-title">Google Calendar</p>
          {calendarConnected ? (
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle size={18} className="text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Calendar conectat</p>
                <p className="text-xs text-green-600">Evenimentele se sincronizeaza automat</p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-stone-500 mb-3">
                Conecteaza Google Calendar ca evenimentele din CRM sa apara automat in calendarul tau.
              </p>
              <a href="/api/auth/google" className="btn btn-primary flex items-center gap-2 w-fit">
                <Calendar size={16} />
                Conecteaza Google Calendar
              </a>
            </div>
          )}
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

export default function SetariPage() {
  return (
    <Suspense fallback={<div className="p-10 text-stone-400">Se incarca...</div>}>
      <SetariContent />
    </Suspense>
  )
}
