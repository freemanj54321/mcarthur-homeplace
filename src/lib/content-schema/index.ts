/**
 * Framework-agnostic content contract — the single source of truth for content
 * shape, shared by the website and (via the content API) any external consumer
 * such as a future mobile app. This module must not import Firebase, Next.js,
 * React, or `server-only`; only `zod` and `isomorphic-dompurify` are allowed.
 */
export * from './version'
export * from './doc'
export * from './media'
export * from './sanitize'
export * from './sections'
export * from './structuredFields'
export * from './collections'
