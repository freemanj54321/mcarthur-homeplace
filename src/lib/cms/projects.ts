import { createCollectionStore } from './collectionStore'
import { ProjectInput } from '@/lib/content-schema'

export const projectsStore = createCollectionStore<ProjectInput>({
  collection: 'projects',
  schema: ProjectInput,
  slugField: 'slug',
})
