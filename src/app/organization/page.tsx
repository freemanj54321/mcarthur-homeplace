import type { Metadata } from 'next'
import { ORGANIZATION } from '@/lib/organization'

// Organization / domain verification page. Google for Nonprofits asks that the
// official domain state which domains belong to the organization; this page is
// that statement, linked from the footer's legal line.

export const metadata: Metadata = {
  title: 'Organization Information — W.T. McArthur Historic Homeplace Foundation',
  description: `Legal name, EIN and official domain of ${ORGANIZATION.legalName}.`,
}

const { legalName, ein, taxStatus, domain } = ORGANIZATION

export default function OrganizationPage() {
  const facts: [string, React.ReactNode][] = [
    ['Legal name', legalName],
    ['Tax status', `${taxStatus}, tax-exempt under Section 501(c)(3) of the Internal Revenue Code`],
    ['EIN', ein],
    ['Official website', <a key="site" href={`https://${domain}`}>https://{domain}</a>],
    ['Official email', `Addresses ending in @${domain}`],
  ]

  return (
    <main className="page fade-in">
      <section style={{ paddingTop: 80, paddingBottom: 96 }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <div className="eyebrow">Organization information</div>
          <h1 className="h-display" style={{ marginTop: 22 }}>{legalName}</h1>

          <dl style={{ marginTop: 40, display: 'grid', gridTemplateColumns: 'minmax(120px, max-content) 1fr', gap: '14px 32px' }}>
            {facts.map(([term, value]) => (
              <div key={term} style={{ display: 'contents' }}>
                <dt style={{ fontWeight: 600 }}>{term}</dt>
                <dd style={{ margin: 0 }}>{value}</dd>
              </div>
            ))}
          </dl>

          <h2 className="h-card" style={{ marginTop: 56 }}>Official domain</h2>
          <p style={{ maxWidth: '65ch' }}>
            <strong>{domain}</strong> is the official and primary domain of {legalName}. It is
            registered to and controlled by the organization, and it hosts both this website
            and the organization&rsquo;s email and Google Workspace account.
          </p>
          <p style={{ maxWidth: '65ch' }}>
            The organization operates no other domains. Any website or email address claiming to
            represent {legalName} under a different domain is not affiliated with us.
          </p>
        </div>
      </section>
    </main>
  )
}
