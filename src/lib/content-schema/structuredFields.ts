/**
 * Client-safe metadata describing the editable fields of each structured
 * collection. No server-only imports — consumed by the admin form/list UI.
 */

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'date'
  | 'slug'
  | 'url'
  | 'image'
  | 'imageList'
  | 'featureList'

export type FieldSpec = {
  name: string
  label: string
  kind: FieldKind
  placeholder?: string
}

export type CollectionMeta = {
  key: string
  label: string // plural, e.g. "Projects"
  singular: string // "Project"
  titleField: string // field shown as the row title
  fields: FieldSpec[]
}

export const COLLECTIONS: Record<string, CollectionMeta> = {
  projects: {
    key: 'projects',
    label: 'Projects',
    singular: 'Project',
    titleField: 'title',
    fields: [
      { name: 'title', label: 'Title', kind: 'text' },
      { name: 'slug', label: 'Slug', kind: 'slug', placeholder: 'main-house' },
      { name: 'subtitle', label: 'Subtitle', kind: 'textarea' },
      { name: 'kind', label: 'Kind', kind: 'text', placeholder: 'Residence' },
      { name: 'built', label: 'Built', kind: 'text' },
      { name: 'architect', label: 'Builder / architect', kind: 'text' },
      { name: 'style', label: 'Style', kind: 'text' },
      { name: 'materials', label: 'Materials', kind: 'text' },
      { name: 'footprint', label: 'Footprint', kind: 'textarea' },
      { name: 'placeholder', label: 'Placeholder label (shown when no image)', kind: 'text' },
      { name: 'excerpt', label: 'Excerpt', kind: 'textarea' },
      { name: 'description', label: 'Description', kind: 'textarea' },
      { name: 'features', label: 'Notable features', kind: 'featureList' },
      { name: 'cardImage', label: 'Card image', kind: 'image' },
      { name: 'heroImages', label: 'Hero images (1 = banner, 2+ = grid)', kind: 'imageList' },
    ],
  },
  news: {
    key: 'news',
    label: 'News & Stories',
    singular: 'Story',
    titleField: 'title',
    fields: [
      { name: 'title', label: 'Title', kind: 'text' },
      { name: 'slug', label: 'Slug', kind: 'slug' },
      { name: 'date', label: 'Date', kind: 'date' },
      { name: 'category', label: 'Category', kind: 'text', placeholder: 'Field Notes' },
      { name: 'placeholder', label: 'Placeholder label (shown when no image)', kind: 'text' },
      { name: 'excerpt', label: 'Excerpt', kind: 'textarea' },
      { name: 'content', label: 'Content', kind: 'textarea' },
      { name: 'image', label: 'Image', kind: 'image' },
    ],
  },
  events: {
    key: 'events',
    label: 'Events',
    singular: 'Event',
    titleField: 'title',
    fields: [
      { name: 'title', label: 'Title', kind: 'text' },
      { name: 'date', label: 'Date', kind: 'date' },
      { name: 'time', label: 'Time', kind: 'text', placeholder: '10:00 — 16:00' },
      { name: 'location', label: 'Location', kind: 'text' },
      { name: 'excerpt', label: 'Excerpt', kind: 'textarea' },
    ],
  },
  milestones: {
    key: 'milestones',
    label: 'Timeline',
    singular: 'Milestone',
    titleField: 'title',
    fields: [
      { name: 'year', label: 'Year', kind: 'text', placeholder: '1893' },
      { name: 'title', label: 'Title', kind: 'text' },
      { name: 'body', label: 'Body', kind: 'textarea' },
    ],
  },
  boardMembers: {
    key: 'boardMembers',
    label: 'Board',
    singular: 'Board member',
    titleField: 'name',
    fields: [
      { name: 'name', label: 'Name', kind: 'text' },
      { name: 'role', label: 'Role', kind: 'text' },
      { name: 'note', label: 'Note', kind: 'text' },
    ],
  },
  partners: {
    key: 'partners',
    label: 'Partners',
    singular: 'Partner',
    titleField: 'name',
    fields: [
      { name: 'name', label: 'Name', kind: 'text' },
      { name: 'url', label: 'Website (optional)', kind: 'url', placeholder: 'https://…' },
    ],
  },
}

export const COLLECTION_KEYS = Object.keys(COLLECTIONS)

/** Build an empty input object for a collection's fields. */
export function emptyValues(meta: CollectionMeta): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const f of meta.fields) {
    switch (f.kind) {
      case 'image': out[f.name] = null; break
      case 'imageList': out[f.name] = []; break
      case 'featureList': out[f.name] = []; break
      default: out[f.name] = ''
    }
  }
  return out
}
