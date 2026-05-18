'use client'

import { TweaksProvider } from '@/context/TweaksContext'
import { TweaksPanel } from './TweaksPanel'
import { DesignOptionsButton } from './DesignOptionsButton'

type Props = {
  header: React.ReactNode
  footer: React.ReactNode
  children: React.ReactNode
}

export function ClientShell({ header, footer, children }: Props) {
  return (
    <TweaksProvider>
      <div className="shell">
        {header}
        {children}
        {footer}
        <TweaksPanel />
        <DesignOptionsButton />
      </div>
    </TweaksProvider>
  )
}
