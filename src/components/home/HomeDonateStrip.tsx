'use client'

import { useTweaks } from '@/context/TweaksContext'
import { DonateStrip } from '@/components/ui/DonateStrip'

export function HomeDonateStrip() {
  const { tweaks } = useTweaks()
  return <DonateStrip style={tweaks.donateStyle} />
}
