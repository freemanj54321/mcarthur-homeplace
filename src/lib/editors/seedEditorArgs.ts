// Argument parsing for scripts/seed-editor.mjs, kept pure so it's unit-tested
// (the script itself only wires credentials and one Firestore write).
// Status: DONE (MCA-29). TODO(MCA-95): superseded by the keyless editor CLI.

export const KNOWN_PROJECTS = [
  'mcarthur-web-dev',
  'mcarthur-web-uat',
  'mcarthur-web-prod',
  'mcarthur-tour',
] as const

export type SeedEditorArgs =
  | { ok: true; project: string; uid: string; email: string; displayName: string }
  | { ok: false; error: string }

/**
 * Parse `--project <id> <uid> <email> "<displayName>" [--confirm-prod]`.
 * There is no default project, so a missing flag can never write to prod.
 */
export function parseSeedEditorArgs(argv: string[]): SeedEditorArgs {
  const confirmProd = argv.includes('--confirm-prod')
  const rest = argv.filter((a) => a !== '--confirm-prod')
  const at = rest.indexOf('--project')
  const project = at === -1 ? undefined : rest[at + 1]
  if (!project) {
    return { ok: false, error: '--project <id> is required (no default, so prod is never hit by accident)' }
  }
  if (!(KNOWN_PROJECTS as readonly string[]).includes(project)) {
    return { ok: false, error: `unknown project "${project}" (expected one of ${KNOWN_PROJECTS.join(', ')})` }
  }
  if (project === 'mcarthur-web-prod' && !confirmProd) {
    return { ok: false, error: 'writing to prod needs --confirm-prod' }
  }
  const [uid, email, displayName] = rest.filter((_, i) => i !== at && i !== at + 1)
  if (!uid || !email || !displayName) {
    return { ok: false, error: 'expected <uid> <email> "<displayName>"' }
  }
  if (!email.includes('@')) return { ok: false, error: `"${email}" is not an email address` }
  return { ok: true, project, uid, email, displayName }
}
