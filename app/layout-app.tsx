import { Sidebar } from '@/components/layout/Sidebar'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-stone-50">
      <Sidebar />
      <main className="flex-1 ml-52 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
