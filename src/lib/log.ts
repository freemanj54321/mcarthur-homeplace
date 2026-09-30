// Structured logging (MCA-32). App Hosting runs on Cloud Run, where a JSON
// object per line on stdout/stderr becomes a structured Cloud Logging entry:
// `severity` and `message` are recognised, other keys become searchable fields.
// No imports on purpose: this is used by the transport-agnostic read layer.

/** A readable one-line description of any thrown value, keeping error codes. */
export function describeError(err: unknown): string {
  if (err instanceof Error) {
    const code = (err as { code?: unknown }).code
    return code !== undefined && code !== null && code !== '' ? `${err.message} [${String(code)}]` : err.message
  }
  if (typeof err === 'string') return err
  if (err && typeof err === 'object') {
    const { message, details, code } = err as { message?: unknown; details?: unknown; code?: unknown }
    const text = typeof message === 'string' ? message : typeof details === 'string' ? details : null
    if (text) return code !== undefined ? `${text} [${String(code)}]` : text
  }
  return 'Unknown error'
}

/**
 * Record that a read failed and the caller is serving a fallback (empty list,
 * null, defaults). Pages stay up, but the failure is no longer invisible —
 * e.g. a missing Firestore index used to show up only as a blank gallery.
 */
export function logFallback(scope: string, err: unknown, context: Record<string, unknown> = {}): void {
  console.warn(
    JSON.stringify({
      severity: 'WARNING',
      message: `${scope} failed; serving fallback`,
      scope,
      error: describeError(err),
      ...context,
    }),
  )
}
