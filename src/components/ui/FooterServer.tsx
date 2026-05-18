import { getFooterNav } from '@/lib/cms/navigation'
import { Footer } from './Footer'

export async function FooterServer() {
  const data = await getFooterNav()
  return <Footer data={data} />
}
