// Grant editor access: writes the editors/{uid} allowlist doc.
//
// Usage:
//   node scripts/seed-editor.mjs --project <id> <uid> <email> "<displayName>"
//   (prod also needs --confirm-prod)
//
// Credentials, in order:
//   - SA_PATH=<key.json>  legacy mcarthur-tour only; the foundation org blocks keys
//   - otherwise Application Default Credentials:
//       gcloud auth application-default login
//
// The uid comes from Firebase console → Authentication after the person has
// tried to sign in once at /admin/login (they're refused, but the user exists).
//
// Status: DONE (MCA-29), keyless; argument checks in src/lib/editors.
// TODO(MCA-95): replaced by a keyless CLI that grants/revokes/lists editors by email.
import { readFileSync } from 'node:fs'
import { applicationDefault, cert, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { parseSeedEditorArgs } from '../src/lib/editors/seedEditorArgs.ts'

const args = parseSeedEditorArgs(process.argv.slice(2))
if (!args.ok) {
  console.error(`Error: ${args.error}`)
  console.error('Usage: node scripts/seed-editor.mjs --project <id> <uid> <email> "<displayName>" [--confirm-prod]')
  process.exit(1)
}

const credential = process.env.SA_PATH
  ? cert(JSON.parse(readFileSync(process.env.SA_PATH, 'utf8')))
  : applicationDefault()
initializeApp({ credential, projectId: args.project })

await getFirestore().collection('editors').doc(args.uid).set({
  email: args.email,
  displayName: args.displayName,
  addedAt: FieldValue.serverTimestamp(),
  addedBy: 'seed-editor',
})
console.log(`Editor ${args.email} (${args.uid}) added in ${args.project}.`)
