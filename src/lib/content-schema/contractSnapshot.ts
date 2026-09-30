// Contract versioning (MCA-136). The content schemas are a public contract for
// the content API and a future mobile app, so a shape change must come with a
// CONTENT_SCHEMA_VERSION bump. This module is pure (no zod import) so the diff
// rules are unit-tested on plain JSON Schema.

export type JsonSchema = Record<string, unknown>
export type ContractSnapshot = { version: string; schemas: Record<string, JsonSchema> }
export type ChangeKind = 'none' | 'additive' | 'breaking'
export type ContractChange = { kind: ChangeKind; reasons: string[] }

const stable = (v: unknown) => JSON.stringify(v)

function props(schema: JsonSchema): Record<string, unknown> {
  return (schema.properties as Record<string, unknown> | undefined) ?? {}
}
function required(schema: JsonSchema): string[] {
  return (schema.required as string[] | undefined) ?? []
}
/** Everything about an object schema except its properties and required list. */
function objectOptions(schema: JsonSchema): JsonSchema {
  const rest = { ...schema }
  delete rest.properties
  delete rest.required
  return rest
}

/**
 * Classify the change from `prev` to `next`. Conservative: anything that could
 * make a consumer's data or code invalid is breaking.
 * - breaking: a schema or property removed, a property's definition changed,
 *   a new required property, a non-object schema changed.
 * - additive: a new schema, a new optional property, a property made optional.
 */
export function classifyChange(
  prev: Record<string, JsonSchema>,
  next: Record<string, JsonSchema>,
): ContractChange {
  const breaking: string[] = []
  const additive: string[] = []

  for (const name of Object.keys(prev)) {
    if (!(name in next)) breaking.push(`${name}: schema removed`)
  }
  for (const [name, schema] of Object.entries(next)) {
    const old = prev[name]
    if (!old) {
      additive.push(`${name}: new schema`)
      continue
    }
    if (stable(old) === stable(schema)) continue
    const bothObjects = old.type === 'object' && schema.type === 'object'
    if (!bothObjects) {
      breaking.push(`${name}: definition changed`)
      continue
    }
    const [oldProps, newProps] = [props(old), props(schema)]
    const [oldReq, newReq] = [required(old), required(schema)]
    for (const key of Object.keys(oldProps)) {
      if (!(key in newProps)) breaking.push(`${name}.${key}: removed`)
      else if (stable(oldProps[key]) !== stable(newProps[key])) breaking.push(`${name}.${key}: definition changed`)
    }
    for (const key of Object.keys(newProps)) {
      if (key in oldProps) continue
      if (newReq.includes(key)) breaking.push(`${name}.${key}: new required property`)
      else additive.push(`${name}.${key}: new optional property`)
    }
    for (const key of newReq) {
      if (key in oldProps && !oldReq.includes(key)) breaking.push(`${name}.${key}: became required`)
    }
    for (const key of oldReq) {
      if (key in newProps && !newReq.includes(key)) additive.push(`${name}.${key}: became optional`)
    }
    if (stable(objectOptions(old)) !== stable(objectOptions(schema))) breaking.push(`${name}: object options changed`)
  }

  if (breaking.length) return { kind: 'breaking', reasons: [...breaking, ...additive] }
  if (additive.length) return { kind: 'additive', reasons: additive }
  return { kind: 'none', reasons: [] }
}

function parse(version: string): [number, number, number] {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(version)
  if (!m) throw new Error(`"${version}" is not a MAJOR.MINOR.PATCH version`)
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}

/** The smallest version that a change of this kind requires after `from`. */
export function requiredVersion(from: string, kind: ChangeKind): string {
  const [major, minor, patch] = parse(from)
  if (kind === 'breaking') return `${major + 1}.0.0`
  if (kind === 'additive') return `${major}.${minor + 1}.0`
  return `${major}.${minor}.${patch}`
}

/** True when `to` is at least `min` (semver order). */
export function isAtLeast(to: string, min: string): boolean {
  const [a, b] = [parse(to), parse(min)]
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i]
  return true
}
