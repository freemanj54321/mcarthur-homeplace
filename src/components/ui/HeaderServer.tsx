import { getPrimaryNav } from '@/lib/cms/navigation'
import { Header } from './Header'

export async function HeaderServer() {
  const data = await getPrimaryNav()
  return <Header data={data} />
}
