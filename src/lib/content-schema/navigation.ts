import { z } from 'zod'

// Site navigation as stored in the `navigation` collection (`primary`, `footer`
// docs). Defaults, the dynamic What to See resolver and the donations filter
// stay in lib/cms/navigation.ts; this is only the shape (decision 6).

export const NavLink = z.object({
  id: z.string(),
  label: z.string().min(1).max(80),
  href: z.string().min(1).max(500),
  kind: z.enum(['internal', 'external']),
})
export type NavLink = z.infer<typeof NavLink>

export const NavItem = NavLink.extend({
  children: z.array(NavLink).optional(),
  /** Expanded at read time from the published `projects` collection. */
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

// Resolved variants (dynamicChildren expanded): what the public Header/Footer
// render and what a content API would return.
export type ResolvedNavLink = NavLink
export type ResolvedNavItem = NavLink & { children?: NavLink[] }
export type ResolvedPrimaryNav = {
  utility: ResolvedNavLink[]
  left: ResolvedNavItem[]
  right: ResolvedNavItem[]
}
export type ResolvedFooterNav = FooterNavInput
