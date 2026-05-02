import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: "Poze'N Cui CRM",
  description: 'Sistem intern de management clienți pentru Poze\'N Cui',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body className={inter.variable}>
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  )
}
