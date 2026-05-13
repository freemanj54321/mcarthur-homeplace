export interface ProjectFeature {
  label: string
  body: string
}

export interface Project {
  id: string
  slug: string
  title: string
  subtitle: string
  kind: string
  built: string
  architect: string
  style: string
  materials: string
  footprint: string
  placeholder: string
  excerpt: string
  description: string
  features: ProjectFeature[]
}

export interface NewsItem {
  id: string
  slug: string
  title: string
  date: string
  category: string
  placeholder: string
  excerpt: string
  content: string
}

export interface Event {
  id: string
  title: string
  date: string
  time: string
  location: string
  excerpt: string
}

export interface Milestone {
  year: string
  title: string
  body: string
}

export interface BoardMember {
  name: string
  role: string
  note: string
}

export const projects: Project[] = [
  {
    id: 'main-house',
    slug: 'main-house',
    title: 'The Main House',
    subtitle: 'Lorem ipsum dolor sit amet',
    kind: 'Residence',
    built: '1893–1898',
    architect: 'Owner-built, with itinerant carpenters',
    style: 'Folk Victorian, southern vernacular',
    materials: 'Long-leaf pine cut on the property; locally-fired brick foundation piers',
    footprint: '2,140 sq ft over two floors, plus a 12-ft wraparound porch',
    placeholder: 'Main House — wraparound porch, southwest elevation',
    excerpt:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    features: [
      { label: 'The wraparound porch', body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
      { label: 'Heart-pine floors', body: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.' },
      { label: 'Twelve-over-twelve windows', body: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.' },
      { label: 'The kitchen ell', body: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.' },
    ],
  },
  {
    id: 'cooper-conner-house',
    slug: 'cooper-conner-house',
    title: 'The Cooper Conner House',
    subtitle: 'Lorem ipsum dolor sit amet',
    kind: 'Neighbor’s residence',
    built: 'c. 1908',
    architect: 'Built by Robert Cooper Conner, Sr.',
    style: 'Pyramidal-roof cottage, southern vernacular',
    materials: 'Sawn pine clapboard over heart-pine framing; tin roof',
    footprint: '1,180 sq ft, single-story, with a full-width front porch',
    placeholder: 'Cooper Conner House — front porch, three-quarter view',
    excerpt:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    features: [
      { label: 'The pyramidal roof', body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.' },
      { label: 'Full-width front porch', body: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo.' },
      { label: 'Original sash windows', body: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla.' },
      { label: 'Beadboard interiors', body: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim.' },
    ],
  },
  {
    id: 'family-cemetery',
    slug: 'family-cemetery',
    title: 'The Family Cemetery',
    subtitle: 'Lorem ipsum dolor sit amet',
    kind: 'Burial ground',
    built: 'First burial 1897',
    architect: '—',
    style: 'Rural family plot, marble and granite markers',
    materials: 'Vermont marble, local granite, hand-cut limestone curbing',
    footprint: 'Roughly half an acre on a southwest-facing hill',
    placeholder: 'Family cemetery — marble headstones at dusk',
    excerpt:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    features: [
      { label: 'Vermont marble markers', body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.' },
      { label: 'Hand-cut limestone curbing', body: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi.' },
      { label: 'The 1897 ledger', body: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.' },
      { label: 'The Pine Knoll oak', body: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.' },
    ],
  },
  {
    id: 'smokehouse',
    slug: 'smokehouse',
    title: 'The Smokehouse & Outbuildings',
    subtitle: 'Lorem ipsum dolor sit amet',
    kind: 'Agricultural outbuildings',
    built: 'c. 1912',
    architect: 'Owner-built',
    style: 'Log construction, hand-hewn sills and corner notches',
    materials: 'Long-leaf pine logs, cedar shake roofs, fieldstone foundations',
    footprint: 'Three buildings — smokehouse (16\xd716), dairy (12\xd714), corn crib (14\xd720)',
    placeholder: 'Smokehouse — log siding, weathered',
    excerpt:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    features: [
      { label: 'The smokehouse', body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.' },
      { label: 'The dairy', body: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi.' },
      { label: 'The corn crib', body: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.' },
      { label: 'Hand-hewn corner notches', body: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.' },
    ],
  },
]

export const news: NewsItem[] = [
  {
    id: 'grant-award',
    slug: 'state-historical-grant-award',
    title: 'Foundation Receives State Historical Grant',
    date: '2026-04-15',
    category: 'Press Release',
    placeholder: 'Press conference at the Main House',
    excerpt: 'A $50,000 matching grant for the Main House restoration — we have until year end to match.',
    content:
      'We are thrilled to announce the State Historical Commission has awarded the foundation a $50,000 matching grant. These funds will be dedicated entirely to structural stabilization of the Main House.',
  },
  {
    id: 'spring-cleanup',
    slug: 'spring-cleanup-day-recap',
    title: 'Spring Cleanup Day, A Quiet Triumph',
    date: '2026-03-22',
    category: 'Field Notes',
    placeholder: 'Volunteers at the smokehouse, March 2026',
    excerpt: 'Forty volunteers cleared two acres of brush around the outbuildings — the foundations are visible again.',
    content:
      'Together, we cleared over two acres of overgrown brush around the outbuildings, making them accessible for the upcoming architectural surveys.',
  },
  {
    id: 'oral-history',
    slug: 'oral-history-launch',
    title: 'The Porch Tapes — An Oral History Series',
    date: '2026-02-08',
    category: 'Project Update',
    placeholder: 'Field recorder on a porch swing',
    excerpt: 'Seventeen interviews recorded so far. We are sharing the first three this spring.',
    content: '',
  },
]

export const events: Event[] = [
  {
    id: 'heritage-day',
    title: 'Annual Heritage Day Festival',
    date: '2026-06-15',
    time: '10:00 — 16:00',
    location: 'The Homeplace Grounds',
    excerpt: 'Demonstrations, live music, and guided tours of the property.',
  },
  {
    id: 'genealogy-workshop',
    title: 'Tracing Your Roots — A Genealogy Workshop',
    date: '2026-05-20',
    time: '14:00 — 16:00',
    location: 'Local Library (Partner Event)',
    excerpt: 'Using local archives and online tools to trace family history in the region.',
  },
  {
    id: 'porch-reading',
    title: 'Porch Reading — Voices of the Homeplace',
    date: '2026-07-12',
    time: '18:30 — 20:00',
    location: 'Main House Porch',
    excerpt: 'Selected oral history excerpts read aloud by descendants and neighbors.',
  },
]

export const milestones: Milestone[] = [
  { year: '1893', title: 'The land is patented',     body: 'William Thomas McArthur patents 160 acres on the south fork.' },
  { year: '1898', title: 'The Main House is raised', body: 'Built in five months, of long-leaf pine cut on the property.' },
  { year: '1912', title: 'A working farm',           body: 'Dairy, smokehouse, and corn crib added; the homeplace reaches full form.' },
  { year: '1947', title: 'The next generation',      body: 'The farm passes to the second generation; tobacco and cattle dominate.' },
  { year: '1989', title: 'The end of farming',       body: 'Active farming ceases. The buildings begin a long quiet.' },
  { year: '2024', title: 'The foundation is formed', body: 'Descendants and neighbors organize to preserve what remains.' },
  { year: '2026', title: 'Restoration begins',       body: 'Foundation, roof, and porch work begin on the Main House.' },
]

export const board: BoardMember[] = [
  { name: 'Marian McArthur Hill',  role: 'President',          note: 'Great-great-granddaughter of W.T.' },
  { name: 'James Cooper Conner',   role: 'Vice President',     note: 'Neighbor, contractor, friend' },
  { name: 'Dr. Lenora Briggs',     role: 'Historian-at-large', note: 'State Historical Society' },
  { name: 'Theodore A. Whittaker', role: 'Treasurer',          note: 'CPA, two-generation donor' },
  { name: 'Aurelia Park',          role: 'Programs Director',  note: 'Oral history & education' },
  { name: 'Beau McArthur',         role: 'Secretary',          note: 'Fifth-generation descendant' },
]

export const partners: string[] = [
  'State Historical Commission',
  'County Heritage Society',
  'Long-leaf Forestry Cooperative',
  'Old Buildings Trust',
  'Regional Library System',
]
