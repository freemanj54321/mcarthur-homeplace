'use client'

import { useTweaks } from '@/context/TweaksContext'
import { HeroPhoto } from './HeroPhoto'
import { HeroCollage } from './HeroCollage'
import { HeroTypographic } from './HeroTypographic'

export function HomeHero() {
  const { tweaks } = useTweaks()
  if (tweaks.hero === 'collage') return <HeroCollage />
  if (tweaks.hero === 'typographic') return <HeroTypographic />
  return <HeroPhoto />
}
