import 'server-only'
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { adminInitMode, resolveStorageBucket } from './firebaseConfig'

// Only reached in 'serviceAccount' mode, which requires the variable to be set.
function loadServiceAccount(raw: string): ServiceAccount {
  try {
    const parsed = JSON.parse(raw)
    return {
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key,
    }
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.')
  }
}

// The init mode is decided in ./firebaseConfig (unit-tested there):
// - emulator — WS2 (MCA-20), DONE. The Admin SDK auto-connects to the Emulator
//   Suite when these hosts are set and needs no credentials, so init with the
//   project id only. Used by E2E and the emulator seed script.
// - serviceAccount: the legacy mcarthur-tour backend and key-based local dev.
// - appHosting: MCA-44. No-arg init reads the injected FIREBASE_CONFIG and uses
//   the backend's own service account, so no key exists (MCA-39).
// - applicationDefault: local dev via `gcloud auth application-default login`.
function buildApp(): App {
  const storageBucket = resolveStorageBucket(process.env)
  switch (adminInitMode(process.env)) {
    case 'emulator':
      return initializeApp({
        projectId:
          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
          process.env.GCLOUD_PROJECT ??
          'demo-mcarthur',
        storageBucket,
      })
    case 'serviceAccount':
      return initializeApp({
        credential: cert(loadServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? '')),
        storageBucket,
      })
    case 'appHosting':
      return initializeApp()
    case 'applicationDefault':
      return initializeApp({
        credential: applicationDefault(),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT,
        storageBucket,
      })
  }
}

let adminApp: App | undefined
function getAdminApp(): App {
  if (adminApp) return adminApp
  const existing = getApps()
  adminApp = existing.length > 0 ? existing[0] : buildApp()
  return adminApp
}

export const adminAuth = () => getAuth(getAdminApp())
export const adminDb = () => getFirestore(getAdminApp())
export const adminStorage = () => getStorage(getAdminApp())
