import { describe, it, expect } from 'vitest'
import { parseSeedEditorArgs } from './seedEditorArgs'

const person = ['uid-123', 'jane@wtmcarthurhomeplace.org', 'Jane Editor']

describe('parseSeedEditorArgs', () => {
  it('parses a dev grant', () => {
    expect(parseSeedEditorArgs(['--project', 'mcarthur-web-dev', ...person])).toEqual({
      ok: true,
      project: 'mcarthur-web-dev',
      uid: 'uid-123',
      email: 'jane@wtmcarthurhomeplace.org',
      displayName: 'Jane Editor',
    })
  })

  it('accepts --project anywhere in the argument list', () => {
    const res = parseSeedEditorArgs([...person, '--project', 'mcarthur-web-uat'])
    expect(res).toMatchObject({ ok: true, project: 'mcarthur-web-uat', uid: 'uid-123' })
  })

  it('has no default project', () => {
    expect(parseSeedEditorArgs(person)).toMatchObject({ ok: false, error: expect.stringContaining('--project') })
    expect(parseSeedEditorArgs(['--project'])).toMatchObject({ ok: false })
  })

  it('rejects unknown projects', () => {
    expect(parseSeedEditorArgs(['--project', 'demo-mcarthur', ...person])).toMatchObject({
      ok: false,
      error: expect.stringContaining('unknown project'),
    })
  })

  it('requires --confirm-prod for prod', () => {
    expect(parseSeedEditorArgs(['--project', 'mcarthur-web-prod', ...person])).toMatchObject({
      ok: false,
      error: expect.stringContaining('--confirm-prod'),
    })
    expect(parseSeedEditorArgs(['--project', 'mcarthur-web-prod', '--confirm-prod', ...person])).toMatchObject({
      ok: true,
      project: 'mcarthur-web-prod',
    })
  })

  it('requires uid, email and name, and a plausible email', () => {
    expect(parseSeedEditorArgs(['--project', 'mcarthur-web-dev', 'uid-123'])).toMatchObject({ ok: false })
    expect(parseSeedEditorArgs(['--project', 'mcarthur-web-dev', 'uid-123', 'not-an-email', 'Jane'])).toMatchObject({
      ok: false,
      error: expect.stringContaining('email'),
    })
  })
})
