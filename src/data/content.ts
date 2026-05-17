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
    subtitle: 'A 350-square-foot cottage acquired in 1893, expanded by 1900 into the central-hall Queen Anne home that still stands today — listed on the National Register of Historic Places.',
    kind: 'Residence',
    built: '1893 core; expanded to present form by 1900',
    architect: 'Original structure pre-1893; additions by W.T. McArthur and his wife, 1893–1900',
    style: 'Queen Anne with central-hall plan additions',
    materials: 'Long-leaf pine cut on the property; locally-fired brick foundation piers',
    footprint: 'Original 350 sq ft four-square (now kitchen, pantry, bath, and dining room); expanded to a central-hall plan with two rooms on each side, an east-side bedroom addition, and a large screened porch joining the two',
    placeholder: 'Main House — southwest elevation',
    excerpt:
      'Acquired by W.T. McArthur in approximately 1893 as a 350-square-foot four-square cottage, the Main House was expanded over the next seven years into the central-hall home that stands today — preserved largely unchanged for three-quarters of a century and listed on the National Register of Historic Places.',
    description:
      'The Queen Anne style home on the property was originally acquired by W.T. McArthur in approximately 1893 as a four-square, three-hundred-and-fifty-square-foot house. This original structure is what is presently the kitchen, pantry, one bath, and a dining room. W.T. and his wife moved into the house and began additions and remodeling, and by 1900 the house had reached its present state: a traditional central-hall design with two rooms on each side. An additional room was built on the east side and used as a bedroom, and a large screened porch was built to attach the new addition to the older structure. At some point — likely in the late 1920s to early 1930s — a small bathroom was added to the east side of the house.\n\nWater was originally provided by a hand-dug well, incorporated as part of the covered porch near the kitchen; the well still exists in its original location. Later, a windmill with a pump and tank was installed near the house for running water. Later still, a kerosene-powered Delco generator provided DC power with battery storage for limited lighting — at a time when only about 3% of American farms had electricity (1922). The Rural Electrification Act of 1936 brought wired power to many rural residents, and the Rural Electrification Association installed the wiring, lights, and outlets at the Historic Homeplace. The home is preserved in the same condition as it has been for the past seventy-five years, and is listed on the National Register of Historic Places.',
    features: [
      { label: 'The original 1893 core', body: 'A 350-square-foot four-square cottage — the oldest part of the house, now serving as the kitchen, pantry, bath, and dining room.' },
      { label: 'The central-hall plan', body: 'By 1900, additions had extended the house into its present central-hall layout, with two rooms on each side of the hall.' },
      { label: 'The east-side addition and screened porch', body: 'An east-side bedroom, joined to the original structure by a large screened porch — and a small east-side bathroom added in the late 1920s or early 1930s.' },
      { label: 'The hand-dug well', body: 'Originally the home’s water source, incorporated into a covered porch near the kitchen. The well still sits in its original location today.' },
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
  { year: '1893', title: 'W.T. acquires the property', body: 'William Thomas McArthur acquires the farm and its original 350 sq ft four-square cottage.' },
  { year: '1900', title: 'The Main House reaches its present form', body: 'Additions and remodeling completed: central-hall plan, east-side bedroom, and screened porch joining old to new.' },
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
