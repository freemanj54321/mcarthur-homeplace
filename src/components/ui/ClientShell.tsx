'use client'

import { TweaksProvider } from '@/context/TweaksContext'
import { TweaksPanel } from './TweaksPanel'
import { DesignOptionsButton } from './DesignOptionsButton'
import { designToolsEnabled } from '@/lib/features'

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
        {/* MCA-91: the design switcher is for dev/uat review, not the public site. */}
        {designToolsEnabled() && (
          <>
            <TweaksPanel />
            <DesignOptionsButton />
          </>
        )}
      </div>
    </TweaksProvider>
  )
}
