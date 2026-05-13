'use client'

import { TweaksProvider } from '@/context/TweaksContext'
import { Header } from './Header'
import { Footer } from './Footer'
import { TweaksPanel } from './TweaksPanel'
import { DesignOptionsButton } from './DesignOptionsButton'

export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <TweaksProvider>
      <div className="shell">
        <Header />
        {children}
        <Footer />
        <TweaksPanel />
        <DesignOptionsButton />
      </div>
    </TweaksProvider>
  )
}
