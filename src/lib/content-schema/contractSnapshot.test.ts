import { describe, it, expect } from 'vitest'
import { classifyChange, requiredVersion, isAtLeast, type JsonSchema } from './contractSnapshot'

const obj = (properties: Record<string, JsonSchema>, required: string[] = []): JsonSchema => ({
  type: 'object',
  properties,
  required,
  additionalProperties: false,
})
const str = { type: 'string' }

describe('classifyChange', () => {
  it('none when identical', () => {
    expect(classifyChange({ A: obj({ a: str }, ['a']) }, { A: obj({ a: str }, ['a']) })).toEqual({ kind: 'none', reasons: [] })
  })

  it('additive: new schema, new optional property, property made optional', () => {
    expect(classifyChange({}, { A: obj({}) }).kind).toBe('additive')
    expect(classifyChange({ A: obj({ a: str }) }, { A: obj({ a: str, b: str }) })).toMatchObject({
      kind: 'additive',
      reasons: ['A.b: new optional property'],
    })
    expect(classifyChange({ A: obj({ a: str }, ['a']) }, { A: obj({ a: str }) }).kind).toBe('additive')
  })

  it('breaking: removals, new required fields, changed definitions', () => {
    expect(classifyChange({ A: obj({}) }, {})).toMatchObject({ kind: 'breaking', reasons: ['A: schema removed'] })
    expect(classifyChange({ A: obj({ a: str }) }, { A: obj({}) }).reasons).toContain('A.a: removed')
    expect(classifyChange({ A: obj({}) }, { A: obj({ b: str }, ['b']) }).reasons).toContain('A.b: new required property')
    expect(classifyChange({ A: obj({ a: str }) }, { A: obj({ a: str }, ['a']) }).reasons).toContain('A.a: became required')
    expect(classifyChange({ A: obj({ a: str }) }, { A: obj({ a: { type: 'number' } }) }).reasons).toContain(
      'A.a: definition changed',
    )
    expect(classifyChange({ E: { enum: ['x'] } }, { E: { enum: ['x', 'y'] } }).kind).toBe('breaking')
    expect(classifyChange({ A: obj({}) }, { A: { ...obj({}), additionalProperties: true } }).reasons).toContain(
      'A: object options changed',
    )
  })

  it('reports breaking even when additive changes come with it', () => {
    const change = classifyChange({ A: obj({ a: str }) }, { A: obj({ b: str }) })
    expect(change.kind).toBe('breaking')
    expect(change.reasons).toEqual(['A.a: removed', 'A.b: new optional property'])
  })
})

describe('versions', () => {
  it('requires major for breaking, minor for additive, nothing otherwise', () => {
    expect(requiredVersion('1.4.2', 'breaking')).toBe('2.0.0')
    expect(requiredVersion('1.4.2', 'additive')).toBe('1.5.0')
    expect(requiredVersion('1.4.2', 'none')).toBe('1.4.2')
  })

  it('compares semver numerically', () => {
    expect(isAtLeast('1.10.0', '1.9.0')).toBe(true)
    expect(isAtLeast('1.9.0', '1.10.0')).toBe(false)
    expect(isAtLeast('2.0.0', '2.0.0')).toBe(true)
    expect(() => requiredVersion('v1', 'none')).toThrow(/MAJOR.MINOR.PATCH/)
  })
})
