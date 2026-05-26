'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

export type HeroVariant   = 'photo' | 'collage' | 'typographic'
export type ColorMode     = 'day' | 'dark'
export type CardLayout    = 'classic' | 'split' | 'overlay'
export type TypePair      = 'A' | 'B' | 'C' | 'D'
export type TartanLevel   = 'subtle' | 'medium' | 'bold'
export type DonateStyle   = 'quiet' | 'banner' | 'sticker'

export interface Tweaks {
  hero:        HeroVariant
  mode:        ColorMode
  cardLayout:  CardLayout
  typepair:    TypePair
  tartan:      TartanLevel
  donateStyle: DonateStyle
}

const DEFAULTS: Tweaks = {
  hero:        'photo',
  mode:        'day',
  cardLayout:  'classic',
  typepair:    'A',
  tartan:      'medium',
  donateStyle: 'quiet',
}

interface TweaksCtx {
  tweaks:    Tweaks
  setTweak:  <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => void
}

const Ctx = createContext<TweaksCtx>({
  tweaks:   DEFAULTS,
  setTweak: () => {},
})

export function TweaksProvider({ children }: { children: ReactNode }) {
  const [tweaks, setTweaks] = useState<Tweaks>(DEFAULTS)

  const setTweak = useCallback(<K extends keyof Tweaks>(key: K, value: Tweaks[K]) => {
    setTweaks((prev) => ({ ...prev, [key]: value }))
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-mode',     tweaks.mode === 'dark' ? 'dark' : 'day')
    root.setAttribute('data-typepair', tweaks.typepair)
    root.setAttribute('data-tartan',   tweaks.tartan)
  }, [tweaks.mode, tweaks.typepair, tweaks.tartan])

  return <Ctx.Provider value={{ tweaks, setTweak }}>{children}</Ctx.Provider>
}

export function useTweaks() {
  return useContext(Ctx)
}
