// The foundation's legal identity, as it appears on its IRS determination
// letter. Shown in the footer and on /organization so third-party verifiers
// (e.g. Google for Nonprofits) can match the site to the legal entity.
// Deliberately code, not CMS content: editors shouldn't be able to change the
// legal name or EIN by accident.
export const ORGANIZATION = {
  legalName: 'W. T. McArthur Historic Homeplace, Inc.',
  ein: '93-4477897',
  taxStatus: '501(c)(3) nonprofit',
  domain: 'wtmcarthurhomeplace.org',
} as const
