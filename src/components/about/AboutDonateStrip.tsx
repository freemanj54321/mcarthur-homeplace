'use client'

import { useTweaks } from '@/context/TweaksContext'
import { DonateStrip } from '@/components/ui/DonateStrip'

export function AboutDonateStrip() {
  const { tweaks } = useTweaks()
  return <DonateStrip style={tweaks.donateStyle} />
}
