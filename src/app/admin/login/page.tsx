import { redirect } from 'next/navigation'
import { getCurrentEditor } from '@/lib/auth/server'
import { LoginForm } from './LoginForm'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ next?: string }>

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const editor = await getCurrentEditor()
  const { next } = await searchParams
  if (editor) redirect(next && next.startsWith('/admin') ? next : '/admin')
  return <LoginForm next={next ?? '/admin'} />
}
