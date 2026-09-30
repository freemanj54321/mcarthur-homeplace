import { describeError } from '@/lib/log'

/**
 * Message shown to editors when a server action fails. Keeps Firebase error
 * codes (e.g. "… [permission-denied]") and reads error-like objects that aren't
 * `Error` instances, such as gRPC statuses (MCA-32).
 */
export function fmtError(e: unknown): string {
  return describeError(e)
}
