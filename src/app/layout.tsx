import type { Metadata } from 'next'
import './globals.css'
import { ClientShell } from '@/components/ui/ClientShell'

export const metadata: Metadata = {
  title: 'W.T. McArthur Historic Homeplace Foundation',
  description:
    'Restoring a 19th-century family farm — the houses, the outbuildings, the cemetery, and the stories that hold them together.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  )
}
