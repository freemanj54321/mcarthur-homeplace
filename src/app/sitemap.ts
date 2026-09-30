import type { MetadataRoute } from 'next'
import { resolveSiteUrl } from '@/lib/firebaseConfig'
import { donationsEnabled } from '@/lib/features'
import { projectsStore } from '@/lib/cms/projects'
import { listPublishedSlugs } from '@/lib/cms/pages'
import { logFallback } from '@/lib/log'

// MCA-130: every public URL, from published content. Rebuilt hourly.
export const revalidate = 3600

const STATIC_PATHS = ['/', '/about', '/visit', '/what-to-see']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = resolveSiteUrl(process.env)
  const [projects, pageSlugs] = await Promise.all([
    projectsStore.listPublished(), // logs + [] on failure (collectionReader)
    listPublishedSlugs().catch((err) => {
      logFallback('sitemap.pageSlugs', err)
      return [] as string[]
    }),
  ])

  const paths = new Set([
    ...STATIC_PATHS,
    ...(donationsEnabled() ? ['/donate'] : []),
    ...projects.map((p) => `/what-to-see/${p.slug}`),
    // CMS pages render at /<slug>; a static route with the same path (e.g.
    // /about) wins, so the Set drops the duplicate.
    ...pageSlugs.map((slug) => `/${slug}`),
  ])

  return [...paths].map((path) => ({
    url: path === '/' ? base : `${base}${path}`,
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : path.split('/').length > 2 ? 0.6 : 0.8,
  }))
}
