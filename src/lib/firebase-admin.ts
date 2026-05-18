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

let adminApp: App | undefined
function getAdminApp(): App {
  if (adminApp) return adminApp
  const existing = getApps()
  if (existing.length > 0) {
    adminApp = existing[0]
    return adminApp
  }
  adminApp = initializeApp({
    credential: cert(loadServiceAccount()),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  })
  return adminApp
}

export const adminAuth = () => getAuth(getAdminApp())
export const adminDb = () => getFirestore(getAdminApp())
export const adminStorage = () => getStorage(getAdminApp())
