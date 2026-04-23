'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Camera } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error('Email sau parolă incorectă')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-brown flex items-center justify-center mx-auto mb-4">
            <Camera size={24} className="text-brand-cream" />
          </div>
          <h1 className="text-2xl font-semibold text-brand-dark">Poze'N Cui</h1>
          <p className="text-sm text-stone-500 mt-1 tracking-widest uppercase">CRM intern</p>
        </div>

        <form onSubmit={handleLogin} className="card space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="radu@pozeincui.ro"
              required
            />
          </div>
          <div>
            <label className="label">Parolă</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center mt-2">
            {loading ? 'Se conectează...' : 'Conectare'}
          </button>
        </form>

        <p className="text-center text-xs text-stone-400 mt-6">
          Poze'N Cui · Sistem intern · pozeincui.ro
        </p>
      </div>
    </div>
  )
}
