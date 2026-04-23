import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const geist = Inter({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: "Poze'N Cui CRM",
  description: 'Sistem intern de management clienți pentru Poze\'N Cui',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ro">
      <body className={geist.variable}>
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  )
}
