import { Placeholder } from './Placeholder'

interface PolaroidProps {
  caption: string
  label: string
  aspect?: 'photo' | 'portrait' | 'square' | 'wide'
  rotate?: number
  taped?: boolean
  style?: React.CSSProperties
  children?: React.ReactNode
}

export function Polaroid({ caption, label, aspect = 'photo', rotate = 0, taped = true, style, children }: PolaroidProps) {
  return (
    <div className="polaroid" data-caption={caption} style={{ transform: `rotate(${rotate}deg)`, ...style }}>
      {taped && <span className="tape" />}
      {children ?? <Placeholder label={label} aspect={aspect} />}
    </div>
  )
}
