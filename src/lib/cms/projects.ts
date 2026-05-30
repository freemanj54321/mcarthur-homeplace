import { z } from 'zod'
import { createCollectionStore, type StoredDoc, type PublicDoc } from './collectionStore'
import { ContentImage, slugSchema } from './media'

export const ProjectFeature = z.object({
  label: z.string().min(1).max(200),
  body: z.string().max(2000),
})
export type ProjectFeature = z.infer<typeof ProjectFeature>

export const ProjectInput = z.object({
  slug: slugSchema,
  title: z.string().min(1).max(200),
  subtitle: z.string().max(600),
  kind: z.string().max(120),
  built: z.string().max(200),
  architect: z.string().max(300),
  style: z.string().max(300),
  materials: z.string().max(400),
  footprint: z.string().max(600),
  /** Fallback label shown by <Placeholder> when no card/hero image is set. */
  placeholder: z.string().max(200),
  excerpt: z.string().max(1200),
  description: z.string().max(8000),
  features: z.array(ProjectFeature),
  cardImage: ContentImage.nullable(),
  heroImages: z.array(ContentImage),
})
export type ProjectInput = z.infer<typeof ProjectInput>

export type ProjectDoc = StoredDoc<ProjectInput>
export type Project = PublicDoc<ProjectInput>

export const projectsStore = createCollectionStore<ProjectInput>({
  collection: 'projects',
  schema: ProjectInput,
  slugField: 'slug',
})
