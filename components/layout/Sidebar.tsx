'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, FileText, GitBranch,
  DollarSign, Calendar, FolderOpen, Settings, LogOut, Camera
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clienti', label: 'Clienți', icon: Users },
  { href: '/oferte', label: 'Oferte', icon: FileText },
  { href: '/pipeline', label: 'Pipeline', icon: GitBranch },
  { href: '/financiar', label: 'Financiar', icon: DollarSign },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/documente', label: 'Documente', icon: FolderOpen },
]

const BOTTOM_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clienti', label: 'Clienți', icon: Users },
  { href: '/oferte', label: 'Oferte', icon: FileText },
  { href: '/pipeline', label: 'Pipeline', icon: GitBranch },
  { href: '/setari', label: 'Setări', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-52 bg-white border-r border-stone-200 flex-col h-screen fixed left-0 top-0 z-30">
        <div className="px-4 py-5 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-brown flex items-center justify-center">
              <Camera size={14} className="text-brand-cream" />
            </div>
            <div>
              <div className="text-sm font-semibold text-stone-900 leading-none">Poze'N Cui</div>
              <div className="text-[10px] text-stone-400 tracking-widest mt-0.5">UNFORGETTABLE</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href}
                className={cn('sidebar-item', active && 'active')}>
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="px-2 py-3 border-t border-stone-100 space-y-0.5">
          <Link href="/setari" className={cn('sidebar-item', pathname === '/setari' && 'active')}>
            <Settings size={16} />
            <span>Setări</span>
          </Link>
          <button onClick={handleLogout} className="sidebar-item w-full text-left">
            <LogOut size={16} />
            <span>Deconectare</span>
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-200 flex items-center justify-around px-2 pb-safe">
        {BOTTOM_NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all min-w-[56px]',
                active ? 'text-brand-brown' : 'text-stone-400'
              )}>
              <Icon size={22} strokeWidth={active ? 2 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
