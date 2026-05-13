interface PlaceholderProps {
  label: string
  aspect?: 'photo' | 'portrait' | 'square' | 'wide' | 'pano'
  style?: React.CSSProperties
  className?: string
}

export function Placeholder({ label, aspect = 'photo', style, className = '' }: PlaceholderProps) {
  return (
    <div className={`placeholder aspect-${aspect} ${className}`} style={style}>
      <div className="placeholder-label">{label}</div>
    </div>
  )
}
