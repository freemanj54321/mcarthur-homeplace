import { describe, it, expect } from 'vitest'
import {
  adminInitMode,
  hasExplicitWebConfig,
  parseFirebaseConfigEnv,
  resolveStorageBucket,
  storageRemotePatterns,
} from './firebaseConfig'

const webappConfig = JSON.stringify({
  apiKey: 'injected-key',
  projectId: 'mcarthur-web-dev',
  storageBucket: 'mcarthur-web-dev.firebasestorage.app',
})

describe('hasExplicitWebConfig', () => {
  it('is true when NEXT_PUBLIC config includes an API key', () => {
    expect(hasExplicitWebConfig({ apiKey: 'abc', projectId: 'p' })).toBe(true)
  })

  it('is false when the NEXT_PUBLIC vars were not set (App Hosting)', () => {
    expect(hasExplicitWebConfig({ apiKey: undefined, projectId: undefined })).toBe(false)
    expect(hasExplicitWebConfig({ apiKey: '' })).toBe(false)
  })
})

describe('parseFirebaseConfigEnv', () => {
  it('parses inline JSON, tolerating surrounding whitespace', () => {
    expect(parseFirebaseConfigEnv(`  ${webappConfig}\n`)).toMatchObject({
      projectId: 'mcarthur-web-dev',
    })
  })

  it.each([
    ['unset', undefined],
    ['empty', ''],
    ['a file path', '/workspace/firebase-config.json'],
    ['malformed JSON', '{"projectId":'],
    ['a JSON array', '[1,2]'],
  ])('returns null for %s', (_label, raw) => {
    expect(parseFirebaseConfigEnv(raw)).toBeNull()
  })
})

describe('resolveStorageBucket', () => {
  it('prefers the explicit NEXT_PUBLIC bucket (legacy backend, local, CI)', () => {
    expect(
      resolveStorageBucket({
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'mcarthur-tour.firebasestorage.app',
        FIREBASE_WEBAPP_CONFIG: webappConfig,
      }),
    ).toBe('mcarthur-tour.firebasestorage.app')
  })

  it('falls back to the App Hosting web config', () => {
    expect(resolveStorageBucket({ FIREBASE_WEBAPP_CONFIG: webappConfig })).toBe(
      'mcarthur-web-dev.firebasestorage.app',
    )
  })

  it('falls back to the Admin SDK config', () => {
    expect(
      resolveStorageBucket({
        FIREBASE_CONFIG: JSON.stringify({ storageBucket: 'mcarthur-web-uat.firebasestorage.app' }),
      }),
    ).toBe('mcarthur-web-uat.firebasestorage.app')
  })

  it('is undefined when nothing provides a bucket', () => {
    expect(resolveStorageBucket({})).toBeUndefined()
    expect(resolveStorageBucket({ NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: '' })).toBeUndefined()
  })
})

describe('storageRemotePatterns', () => {
  it('allows only this bucket on the Storage download host', () => {
    expect(storageRemotePatterns('mcarthur-web-prod.firebasestorage.app')).toEqual([
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/mcarthur-web-prod.firebasestorage.app/**',
      },
    ])
  })

  it('allows no remote images when there is no bucket', () => {
    expect(storageRemotePatterns(undefined)).toEqual([])
  })
})

describe('adminInitMode', () => {
  it('uses the emulator whenever FIRESTORE_EMULATOR_HOST is set, even with a key', () => {
    expect(
      adminInitMode({ FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080', FIREBASE_SERVICE_ACCOUNT_JSON: '{}' }),
    ).toBe('emulator')
  })

  it('keeps the service-account path when a key is provided, even on App Hosting', () => {
    // The legacy mcarthur-tour backend has both until cutover; behavior must not change.
    expect(adminInitMode({ FIREBASE_SERVICE_ACCOUNT_JSON: '{}', FIREBASE_CONFIG: '{}' })).toBe(
      'serviceAccount',
    )
  })

  it('goes keyless on App Hosting when only FIREBASE_CONFIG is injected', () => {
    expect(adminInitMode({ FIREBASE_CONFIG: '{"projectId":"mcarthur-web-dev"}' })).toBe('appHosting')
  })

  it('falls back to Application Default Credentials otherwise', () => {
    expect(adminInitMode({})).toBe('applicationDefault')
  })
})
