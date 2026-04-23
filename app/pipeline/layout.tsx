import { Sidebar } from '@/components/layout/Sidebar'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-stone-50">
      <Sidebar />
      <main className="flex-1 md:ml-52 overflow-y-auto pb-20 md:pb-0">
        {children}
      </main>
    </div>
  )
}
