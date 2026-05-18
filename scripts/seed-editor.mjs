// Usage:
//   node scripts/seed-editor.mjs <uid> <email> "<displayName>"
// Reads service account from $SA_PATH (defaults to the Downloads file).
import { readFileSync } from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const SA_PATH =
  process.env.SA_PATH ||
  'C:\\Users\\freem\\Downloads\\mcarthur-tour-firebase-adminsdk-fbsvc-b911776d93.json'

const sa = JSON.parse(readFileSync(SA_PATH, 'utf8'))

initializeApp({
  credential: cert({
    projectId: sa.project_id,
    clientEmail: sa.client_email,
    privateKey: sa.private_key,
  }),
})

const [, , uid, email, displayName] = process.argv
if (!uid || !email || !displayName) {
  console.error('Usage: node scripts/seed-editor.mjs <uid> <email> "<displayName>"')
  process.exit(1)
}

const db = getFirestore()
await db.collection('editors').doc(uid).set({
  email,
  displayName,
  addedAt: FieldValue.serverTimestamp(),
  addedBy: 'seed-script',
})

console.log(`Created editors/${uid}`)
process.exit(0)
