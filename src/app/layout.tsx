import type { Metadata } from 'next'
import './globals.css'
import { ClientShell } from '@/components/ui/ClientShell'
import { HeaderServer } from '@/components/ui/HeaderServer'
import { FooterServer } from '@/components/ui/FooterServer'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'W.T. McArthur Historic Homeplace Foundation',
  description:
    'Restoring a 19th-century family farm — the houses, the outbuildings, the cemetery, and the stories that hold them together.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="day" data-typepair="A" data-tartan="medium">
      <body>
        <ClientShell header={<HeaderServer />} footer={<FooterServer />}>
          {children}
        </ClientShell>
      </body>
    </html>
  )
}
