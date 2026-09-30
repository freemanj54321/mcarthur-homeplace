import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import * as contract from './index'
import { CONTENT_SCHEMA_VERSION } from './version'
import { classifyChange, isAtLeast, requiredVersion, type ContractSnapshot, type JsonSchema } from './contractSnapshot'

// MCA-136 — DONE. Guards the public content contract. The committed snapshot
// holds the JSON Schema of every exported zod schema plus the version it was
// taken at. Changing a schema makes this test fail until the snapshot is
// refreshed with `npm run contract:snapshot`, which refuses unless
// CONTENT_SCHEMA_VERSION was bumped enough (major = breaking, minor = additive).

const SNAPSHOT = fileURLToPath(new URL('./contract.snapshot.json', import.meta.url))

function currentSnapshot(): ContractSnapshot {
  const schemas: Record<string, JsonSchema> = {}
  for (const [name, value] of Object.entries(contract).sort(([a], [b]) => a.localeCompare(b))) {
    if (value instanceof z.ZodType) schemas[name] = z.toJSONSchema(value) as JsonSchema
  }
  return { version: CONTENT_SCHEMA_VERSION, schemas }
}

const current = currentSnapshot()

if (process.env.UPDATE_CONTRACT_SNAPSHOT === '1') {
  const prev: ContractSnapshot | null = existsSync(SNAPSHOT) ? JSON.parse(readFileSync(SNAPSHOT, 'utf8')) : null
  if (prev) {
    const change = classifyChange(prev.schemas, current.schemas)
    const min = requiredVersion(prev.version, change.kind)
    if (change.kind !== 'none' && (current.version === prev.version || !isAtLeast(current.version, min))) {
      throw new Error(
        `Contract change is ${change.kind}; bump CONTENT_SCHEMA_VERSION to at least ${min} ` +
          `(src/lib/content-schema/version.ts) first.\n  ${change.reasons.join('\n  ')}`,
      )
    }
  }
  writeFileSync(SNAPSHOT, JSON.stringify(current, null, 2) + '\n')
}

describe('content contract snapshot', () => {
  it('covers every exported schema', () => {
    expect(Object.keys(current.schemas).length).toBeGreaterThanOrEqual(20)
  })

  it('matches the live schemas and version (run `npm run contract:snapshot` after a bump)', () => {
    const saved: ContractSnapshot = JSON.parse(readFileSync(SNAPSHOT, 'utf8'))
    const change = classifyChange(saved.schemas, current.schemas)
    const hint =
      change.kind === 'none'
        ? `CONTENT_SCHEMA_VERSION changed (${saved.version} → ${current.version}); refresh the snapshot.`
        : `Contract change is ${change.kind}: bump CONTENT_SCHEMA_VERSION to at least ` +
          `${requiredVersion(saved.version, change.kind)}, then run \`npm run contract:snapshot\`.\n  ` +
          change.reasons.join('\n  ')
    expect(saved, hint).toEqual(current)
  })
})
