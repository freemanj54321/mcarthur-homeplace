interface TartanRuleProps {
  thin?: boolean
  style?: React.CSSProperties
}

export function TartanRule({ thin = false, style }: TartanRuleProps) {
  return <div className={`tartan-rule${thin ? ' thin' : ''}`} style={style} aria-hidden="true" />
}
