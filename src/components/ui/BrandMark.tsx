import Image from 'next/image'

interface BrandMarkProps {
  size?: number
}

export function BrandMark({ size = 56 }: BrandMarkProps) {
  return (
    <Image
      src="/images/logo.png"
      alt="W.T. McArthur Homeplace, Est. 1893"
      className="brand-logo"
      height={size}
      width={size}
      style={{ height: size, width: 'auto' }}
    />
  )
}
