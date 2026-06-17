// Lightweight in-memory Firestore for unit/integration tests.
//
// Implements the subset of the firebase-admin Firestore surface the codebase
// actually uses: collection().get()/add()/doc()/where(), doc().get()/set()/
// update()/delete(), chainable where()/orderBy(), and batch().update()/commit().
// Only the '==' filter operator is supported (the only one used). This is the
// shared backbone for WS1 store/action tests — extend it here rather than
// reinventing per test. See WS0 (MCA-18).
import { Timestamp } from 'firebase-admin/firestore'

export type DocData = Record<string, unknown>
type Store = Map<string, DocData>

/** FieldValue.serverTimestamp() returns a transform sentinel (a non-plain class
 * instance). Materialize it to a concrete Timestamp on write so reads behave
 * like production (toStored/tsToMillis see a real Timestamp). */
function isSentinel(v: unknown): boolean {
  return (
    typeof v === 'object' &&
    v !== null &&
    !Array.isArray(v) &&
    !(v instanceof Timestamp) &&
    Object.getPrototypeOf(v) !== Object.prototype
  )
}

function materialize(data: DocData): DocData {
  const out: DocData = {}
  for (const [k, v] of Object.entries(data)) {
    out[k] = isSentinel(v) ? Timestamp.now() : v
  }
  return out
}

class FakeDocSnapshot {
  constructor(
    readonly id: string,
    private readonly _data: DocData | undefined,
  ) {}
  get exists(): boolean {
    return this._data !== undefined
  }
  data(): DocData | undefined {
    return this._data ? { ...this._data } : undefined
  }
}

class FakeDocRef {
  constructor(
    private readonly store: Store,
    readonly id: string,
  ) {}
  async get(): Promise<FakeDocSnapshot> {
    const data = this.store.get(this.id)
    return new FakeDocSnapshot(this.id, data ? { ...data } : undefined)
  }
  async set(data: DocData): Promise<void> {
    this.store.set(this.id, materialize(data))
  }
  async update(data: DocData): Promise<void> {
    const current = this.store.get(this.id)
    if (!current) throw new Error(`No document to update: ${this.id}`)
    this.store.set(this.id, { ...current, ...materialize(data) })
  }
  async delete(): Promise<void> {
    this.store.delete(this.id)
  }
}

type Filter = { field: string; value: unknown }

class FakeQuery {
  constructor(
    protected readonly store: Store,
    protected readonly filters: Filter[] = [],
    protected readonly order: { field: string; dir: 'asc' | 'desc' } | null = null,
  ) {}

  where(field: string, op: string, value: unknown): FakeQuery {
    if (op !== '==') throw new Error(`FakeFirestore only supports '==' (got '${op}')`)
    return new FakeQuery(this.store, [...this.filters, { field, value }], this.order)
  }

  orderBy(field: string, dir: 'asc' | 'desc' = 'asc'): FakeQuery {
    return new FakeQuery(this.store, this.filters, { field, dir })
  }

  async get(): Promise<{ docs: FakeDocSnapshot[]; size: number; empty: boolean }> {
    let entries = [...this.store.entries()].filter(([, data]) =>
      this.filters.every((f) => data[f.field] === f.value),
    )
    if (this.order) {
      const { field, dir } = this.order
      entries = entries.sort(([, a], [, b]) => {
        const av = a[field] as number | string
        const bv = b[field] as number | string
        const cmp = av < bv ? -1 : av > bv ? 1 : 0
        return dir === 'asc' ? cmp : -cmp
      })
    }
    const docs = entries.map(([id, data]) => new FakeDocSnapshot(id, { ...data }))
    return { docs, size: docs.length, empty: docs.length === 0 }
  }
}

class FakeCollectionRef extends FakeQuery {
  doc(id?: string): FakeDocRef {
    return new FakeDocRef(this.store, id ?? crypto.randomUUID())
  }
  async add(data: DocData): Promise<FakeDocRef> {
    const id = crypto.randomUUID()
    this.store.set(id, materialize(data))
    return new FakeDocRef(this.store, id)
  }
}

type BatchOp = () => Promise<void>

class FakeWriteBatch {
  private readonly ops: BatchOp[] = []
  update(ref: FakeDocRef, data: DocData): this {
    this.ops.push(() => ref.update(data))
    return this
  }
  set(ref: FakeDocRef, data: DocData): this {
    this.ops.push(() => ref.set(data))
    return this
  }
  delete(ref: FakeDocRef): this {
    this.ops.push(() => ref.delete())
    return this
  }
  async commit(): Promise<void> {
    for (const op of this.ops) await op()
  }
}

export class FakeFirestore {
  private readonly collections = new Map<string, Store>()

  constructor(seed?: Record<string, Record<string, DocData>>) {
    if (seed) {
      for (const [name, docs] of Object.entries(seed)) {
        for (const [id, data] of Object.entries(docs)) this.seed(name, id, data)
      }
    }
  }

  private storeFor(name: string): Store {
    let store = this.collections.get(name)
    if (!store) {
      store = new Map()
      this.collections.set(name, store)
    }
    return store
  }

  collection(name: string): FakeCollectionRef {
    return new FakeCollectionRef(this.storeFor(name))
  }

  doc(path: string): FakeDocRef {
    const [name, ...rest] = path.split('/')
    return new FakeDocRef(this.storeFor(name), rest.join('/'))
  }

  batch(): FakeWriteBatch {
    return new FakeWriteBatch()
  }

  /** Test helper: insert a doc directly (bypasses materialize for raw control). */
  seed(collection: string, id: string, data: DocData): void {
    this.storeFor(collection).set(id, { ...data })
  }

  /** Test helper: read raw stored data for assertions. */
  raw(collection: string, id: string): DocData | undefined {
    const data = this.collections.get(collection)?.get(id)
    return data ? { ...data } : undefined
  }
}

export function createFakeFirestore(
  seed?: Record<string, Record<string, DocData>>,
): FakeFirestore {
  return new FakeFirestore(seed)
}
