// Per-environment feature flags (MCA-71).
//
// Flags come from each App Hosting backend's apphosting.<env>.yaml, so the same
// code promoted develop → uat → master can behave differently per environment.
//
// WHY `NEXT_PUBLIC_` + literal reads: client components consult these flags, and
// Next.js only inlines `process.env.NEXT_PUBLIC_*` into the browser bundle when
// the property is read literally (no `process.env[name]`, no destructuring).
// Each read therefore spells out the full variable name. App Hosting builds per
// backend, so every environment gets its own value baked in.

/** The public route of the (prototype) donation flow. */
export const DONATE_PATH = '/donate'

/**
 * Whether the donation flow is exposed. Fails closed: anything other than the
 * exact string "true" is off, so prod ("false"), the legacy backend (unset), and
 * local builds without the variable all hide donations.
 *
 * TODO(MCA-71): on for dev/uat only while the form is a prototype with no
 * payment backend. Remove the flag once Stripe (CMS Phase 6) ships to prod.
 */
export function donationsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DONATIONS_ENABLED === 'true'
}

/**
 * Whether the temporary design tools (TweaksPanel + its "Design Options"
 * button, ONBOARDING decision 2) are shown. Fails closed like donations: only
 * "true" turns them on, so prod ("false") and anything unset hide them.
 *
 * TODO(MCA-24): remove with TweaksPanel/TweaksContext once the design is locked.
 */
export function designToolsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DESIGN_TOOLS_ENABLED === 'true'
}

/** True for links into the donation flow (`/donate`, `/donate/...`, `/donate?x`, `/donate#x`). */
export function isDonateHref(href: string): boolean {
  return href === DONATE_PATH || /^\/donate(?=[/?#])/.test(href)
}
