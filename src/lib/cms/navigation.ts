import 'server-only'
import { FieldValue } from 'firebase-admin/firestore'
import { z } from 'zod'
import { adminDb } from '@/lib/firebase-admin'
import { projectsStore } from '@/lib/cms/projects'
import { donationsEnabled, isDonateHref } from '@/lib/features'

const COL = 'navigation'

export const NavLink = z.object({
  id: z.string(),
  label: z.string().min(1).max(80),
  href: z.string().min(1).max(500),
  kind: z.enum(['internal', 'external']),
})
export type NavLink = z.infer<typeof NavLink>

export const NavItem = NavLink.extend({
  children: z.array(NavLink).optional(),
  dynamicChildren: z.literal('projects').optional(),
})
export type NavItem = z.infer<typeof NavItem>

export const PrimaryNavInput = z.object({
  utility: z.array(NavLink),
  left: z.array(NavItem),
  right: z.array(NavItem),
})
export type PrimaryNavInput = z.infer<typeof PrimaryNavInput>

export const FooterColumn = z.object({
  id: z.string(),
  heading: z.string().min(1).max(80),
  links: z.array(NavLink),
})
export type FooterColumn = z.infer<typeof FooterColumn>

export const FooterNavInput = z.object({
  tagline: z.string().max(280),
  columns: z.array(FooterColumn),
  bottomLinks: z.array(NavLink),
})
export type FooterNavInput = z.infer<typeof FooterNavInput>

// Resolved variants (with dynamicChildren expanded). These are what the
// public Header/Footer components consume.
export type ResolvedNavLink = NavLink
export type ResolvedNavItem = NavLink & { children?: NavLink[] }
export type ResolvedPrimaryNav = {
  utility: ResolvedNavLink[]
  left: ResolvedNavItem[]
  right: ResolvedNavItem[]
}
export type ResolvedFooterNav = FooterNavInput

const DEFAULT_PRIMARY: PrimaryNavInput = {
  utility: [
    { id: 'util-visit',  label: 'Plan a Visit', href: '/visit',  kind: 'internal' },
    { id: 'util-donate', label: 'Donate',       href: '/donate', kind: 'internal' },
  ],
  left: [
    { id: 'nav-about',       label: 'About',       href: '/about',        kind: 'internal' },
    { id: 'nav-whattosee',   label: 'What to See', href: '/what-to-see',  kind: 'internal', dynamicChildren: 'projects' },
  ],
  right: [
    { id: 'nav-stories', label: 'Stories', href: '/stories', kind: 'internal' },
    { id: 'nav-visit',   label: 'Visit',   href: '/visit',   kind: 'internal' },
  ],
}

const DEFAULT_FOOTER: FooterNavInput = {
  tagline: 'A century of weather,\na generation of care.',
  columns: [
    {
      id: 'col-explore',
      heading: 'Explore',
      links: [
        { id: 'foot-about',   label: 'Our Story',       href: '/about',       kind: 'internal' },
        { id: 'foot-wts',     label: 'What to See',     href: '/what-to-see', kind: 'internal' },
        { id: 'foot-stories', label: 'Stories & News',  href: '/stories',     kind: 'internal' },
        { id: 'foot-visit',   label: 'Plan a Visit',    href: '/visit',       kind: 'internal' },
      ],
    },
    {
      id: 'col-involved',
      heading: 'Get Involved',
      links: [
        { id: 'foot-donate',  label: 'Make a Donation',     href: '/donate', kind: 'internal' },
        { id: 'foot-vol',     label: 'Volunteer',           href: '/',       kind: 'internal' },
        { id: 'foot-share',   label: 'Share Your Story',    href: '/',       kind: 'internal' },
        { id: 'foot-edu',     label: 'Educational Resources', href: '/',     kind: 'internal' },
      ],
    },
  ],
  bottomLinks: [
    { id: 'foot-privacy', label: 'Privacy',       href: '/',        kind: 'internal' },
    { id: 'foot-a11y',    label: 'Accessibility', href: '/',        kind: 'internal' },
    { id: 'foot-contact', label: 'Contact',       href: '/contact', kind: 'internal' },
  ],
}

function resolveDynamicChildren(item: NavItem, projectLinks: NavLink[]): ResolvedNavItem {
  if (!item.dynamicChildren) {
    const { dynamicChildren: _, ...rest } = item
    return rest
  }
  if (item.dynamicChildren === 'projects') {
    const fixed = item.children ?? []
    return {
      id: item.id,
      label: item.label,
      href: item.href,
      kind: item.kind,
      children: [...fixed, ...projectLinks],
    }
  }
  return item
}

// MCA-71: with donations off (prod), drop every link into the donation flow,
// from the defaults and from editor-saved nav alike. Filtering here rather than
// in Firestore keeps each environment's nav data identical for content copies.
// The admin editor (getPrimaryNavRaw / getFooterNavRaw) still sees the saved
// links unfiltered, so a save on prod never erases them.
function keepLink(link: NavLink): boolean {
  return donationsEnabled() || !isDonateHref(link.href)
}

function filterItem(item: ResolvedNavItem): ResolvedNavItem {
  return item.children ? { ...item, children: item.children.filter(keepLink) } : item
}

async function getProjectNavLinks(): Promise<NavLink[]> {
  try {
    const published = await projectsStore.listPublished()
    return published.map((p) => ({
      id: `dyn-${p.slug}`,
      label: p.title,
      href: `/what-to-see/${p.slug}`,
      kind: 'internal' as const,
    }))
  } catch {
    // Service account unavailable (e.g. local dev without env). Empty dropdown.
    return []
  }
}

export async function getPrimaryNav(): Promise<ResolvedPrimaryNav> {
  let raw: PrimaryNavInput = DEFAULT_PRIMARY
  try {
    const snap = await adminDb().collection(COL).doc('primary').get()
    if (snap.exists) {
      const parsed = PrimaryNavInput.safeParse(snap.data())
      if (parsed.success) raw = parsed.data
    }
  } catch {
    // Service account unavailable (e.g. local dev without env). Use defaults.
  }
  const projectLinks = await getProjectNavLinks()
  const resolve = (items: NavItem[]) =>
    items.filter(keepLink).map((item) => filterItem(resolveDynamicChildren(item, projectLinks)))
  return {
    utility: raw.utility.filter(keepLink),
    left: resolve(raw.left),
    right: resolve(raw.right),
  }
}

export async function getPrimaryNavRaw(): Promise<PrimaryNavInput> {
  try {
    const snap = await adminDb().collection(COL).doc('primary').get()
    if (snap.exists) {
      const parsed = PrimaryNavInput.safeParse(snap.data())
      if (parsed.success) return parsed.data
    }
  } catch {
    // fall through
  }
  return DEFAULT_PRIMARY
}

/** Saved footer as editors see it: unfiltered, so saving never drops links (MCA-71). */
export async function getFooterNavRaw(): Promise<FooterNavInput> {
  try {
    const snap = await adminDb().collection(COL).doc('footer').get()
    if (snap.exists) {
      const parsed = FooterNavInput.safeParse(snap.data())
      if (parsed.success) return parsed.data
    }
  } catch {
    // fall through
  }
  return DEFAULT_FOOTER
}

export async function getFooterNav(): Promise<ResolvedFooterNav> {
  const raw = await getFooterNavRaw()
  return {
    ...raw,
    columns: raw.columns.map((col) => ({ ...col, links: col.links.filter(keepLink) })),
    bottomLinks: raw.bottomLinks.filter(keepLink),
  }
}

export async function savePrimaryNav(input: PrimaryNavInput, editorUid: string): Promise<void> {
  await adminDb().collection(COL).doc('primary').set({
    ...input,
    updatedBy: editorUid,
    updatedAt: FieldValue.serverTimestamp(),
  })
}

export async function saveFooterNav(input: FooterNavInput, editorUid: string): Promise<void> {
  await adminDb().collection(COL).doc('footer').set({
    ...input,
    updatedBy: editorUid,
    updatedAt: FieldValue.serverTimestamp(),
  })
}
