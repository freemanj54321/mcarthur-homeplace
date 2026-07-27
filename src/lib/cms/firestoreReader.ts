/**
 * Minimal structural description of the Firestore surface the content READ
 * path uses.
 *
 * WHY this is hand-written instead of imported from `firebase-admin`: the read
 * layer must carry no Firebase dependency. `firebase-admin` is `server-only`
 * and requires a service account, which would force the content API (MCA-53)
 * and any future non-Next runtime to drag in credentials just to read
 * published content. Anything that satisfies these shapes can drive the read
 * layer — the Admin SDK, the client SDK, a REST-backed reader, or a test fake.
 *
 * Kept deliberately small: only `collection`/`doc`/`where('==')`/`get`, which
 * is everything the read path actually calls. Ordering is done in memory (see
 * `collectionReader.ts`) so no `orderBy` — that also keeps these reads free of
 * composite-index requirements. See MCA-26.
 */

export type ReadDocData = Record<string, unknown>

export interface ReadDocSnapshot {
  readonly id: string
  readonly exists: boolean
  data(): ReadDocData | undefined
}

export interface ReadQuerySnapshot {
  readonly docs: ReadDocSnapshot[]
}

export interface ReadQuery {
  where(field: string, op: '==', value: unknown): ReadQuery
  get(): Promise<ReadQuerySnapshot>
}

export interface ReadDocRef {
  get(): Promise<ReadDocSnapshot>
}

export interface ReadCollectionRef extends ReadQuery {
  doc(id: string): ReadDocRef
}

export interface FirestoreReader {
  collection(name: string): ReadCollectionRef
}

/**
 * Resolves the backing Firestore. A thunk rather than an instance so importing
 * a store never eagerly initialises credentials — the Admin SDK only boots on
 * the first actual read.
 */
export type FirestoreReaderAccessor = () => FirestoreReader
