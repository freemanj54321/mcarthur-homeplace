import { z } from 'zod'

export const RichTextSection = z.object({
  id: z.string(),
  type: z.literal('richText'),
  html: z.string(),
})

export const ImageSection = z.object({
  id: z.string(),
  type: z.literal('image'),
  storagePath: z.string(),
  downloadUrl: z.string().url(),
  alt: z.string(),
  caption: z.string().optional(),
})

export const TwoColumnSection = z.object({
  id: z.string(),
  type: z.literal('twoColumn'),
  leftHtml: z.string(),
  rightHtml: z.string(),
})

export const QuoteSection = z.object({
  id: z.string(),
  type: z.literal('quote'),
  html: z.string(),
  attribution: z.string().optional(),
})

export const CalloutSection = z.object({
  id: z.string(),
  type: z.literal('callout'),
  tone: z.enum(['info', 'donate']),
  html: z.string(),
})

export const GallerySection = z.object({
  id: z.string(),
  type: z.literal('gallery'),
  photoIds: z.array(z.string()),
})

export const Section = z.discriminatedUnion('type', [
  RichTextSection,
  ImageSection,
  TwoColumnSection,
  QuoteSection,
  CalloutSection,
  GallerySection,
])
export type Section = z.infer<typeof Section>
export type SectionType = Section['type']

export const Hero = z
  .object({
    storagePath: z.string(),
    downloadUrl: z.string().url(),
    alt: z.string(),
  })
  .nullable()
export type Hero = z.infer<typeof Hero>

const SLUG = /^[a-z0-9]+(?:[-/][a-z0-9]+)*$/

export const PageDraftInput = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(SLUG, 'lowercase letters, numbers, "-" or "/" segments only')
    .refine((s) => !s.startsWith('admin') && s !== 'admin', 'cannot start with "admin"'),
  title: z.string().min(1).max(200),
  hero: Hero,
  sections: z.array(Section),
})
export type PageDraftInput = z.infer<typeof PageDraftInput>

export type PageStatus = 'draft' | 'published'

export type PageDoc = PageDraftInput & {
  id: string
  status: PageStatus
  publishedSnapshot: Pick<PageDraftInput, 'title' | 'hero' | 'sections'> | null
  publishedAt: number | null
  createdBy: string
  createdAt: number
  updatedBy: string
  updatedAt: number
}

export const SECTION_LABELS: Record<SectionType, string> = {
  richText: 'Rich text',
  image: 'Image',
  twoColumn: 'Two-column text',
  quote: 'Quote',
  callout: 'Callout',
  gallery: 'Gallery',
}

export function newSection(type: SectionType): Section {
  const id = crypto.randomUUID()
  switch (type) {
    case 'richText':  return { id, type, html: '<p></p>' }
    case 'image':     return { id, type, storagePath: '', downloadUrl: '', alt: '' }
    case 'twoColumn': return { id, type, leftHtml: '<p></p>', rightHtml: '<p></p>' }
    case 'quote':     return { id, type, html: '<p></p>' }
    case 'callout':   return { id, type, tone: 'info', html: '<p></p>' }
    case 'gallery':   return { id, type, photoIds: [] }
  }
}
