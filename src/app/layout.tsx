import type { Metadata } from 'next'
import './globals.css'
import { ClientShell } from '@/components/ui/ClientShell'
import { HeaderServer } from '@/components/ui/HeaderServer'
import { FooterServer } from '@/components/ui/FooterServer'
import { resolveSiteUrl } from '@/lib/firebaseConfig'

export const revalidate = 60

const SITE_NAME = 'W.T. McArthur Historic Homeplace Foundation'
const DESCRIPTION =
  'Restoring a 19th-century family farm — the houses, the outbuildings, the cemetery, and the stories that hold them together.'

export const metadata: Metadata = {
  // Absolute base for canonical/OG URLs: this environment's own origin (MCA-130).
  metadataBase: new URL(resolveSiteUrl(process.env)),
  title: SITE_NAME,
  description: DESCRIPTION,
  // Default link preview; pages can override.
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_US',
    title: SITE_NAME,
    description: DESCRIPTION,
    images: [{ url: '/images/main-house.jpg', alt: 'The Main House at the W.T. McArthur Homeplace' }],
  },
  twitter: { card: 'summary_large_image' },
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
