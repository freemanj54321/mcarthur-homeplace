import 'server-only'
import { cert, getApps, initializeApp, type App, type ServiceAccount } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

function loadServiceAccount(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!raw) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_JSON is not set. Paste the JSON contents of your service-account key file into this env var.',
    )
  }
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

// The Admin SDK auto-connects to the Emulator Suite when these hosts are set.
// In that mode it does not need real service-account credentials, so we skip
// the FIREBASE_SERVICE_ACCOUNT_JSON requirement and init with the project id
// only. Used by E2E (WS2) and the emulator seed script.
const usingEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST)

let adminApp: App | undefined
function getAdminApp(): App {
  if (adminApp) return adminApp
  const existing = getApps()
  if (existing.length > 0) {
    adminApp = existing[0]
    return adminApp
  }
  adminApp = initializeApp(
    usingEmulator
      ? {
          projectId:
            process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
            process.env.GCLOUD_PROJECT ??
            'demo-mcarthur',
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        }
      : {
          credential: cert(loadServiceAccount()),
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        },
  )
  return adminApp
}

export const adminAuth = () => getAuth(getAdminApp())
export const adminDb = () => getFirestore(getAdminApp())
export const adminStorage = () => getStorage(getAdminApp())
