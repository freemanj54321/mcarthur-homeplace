// Test stub for the `server-only` package.
//
// `server-only` deliberately throws when imported outside React Server
// Component bundling. Under Vitest (plain Node) that import would crash every
// server module (firebase-admin, lib/cms/*, lib/auth/*), so we alias the
// package to this empty module in vitest.config.ts. See WS0 (MCA-18).
export {}
