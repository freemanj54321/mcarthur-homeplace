import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DonateForm } from './DonateForm'

// WS2 (MCA-20) — DONE. Component-interaction coverage for the DonateForm step
// machine called for in the issue scope (full E2E for this flow is overkill;
// the multi-step amount → designation → details → review → confirm path and
// its validation gates are covered here under jsdom). The browser-level E2E
// happy-path test is stubbed as test.fixme in e2e/public.spec.ts pending real
// payment-free assertions against the rendered page.

const projects = [
  { slug: 'main-house', title: 'The Main House' },
  { slug: 'onion-barn', title: 'The Onion Barn' },
]

function renderForm() {
  return render(<DonateForm projects={projects} />)
}

describe('DonateForm step machine', () => {
  it('starts on the Amount step', () => {
    renderForm()
    expect(screen.getByRole('heading', { name: /choose an amount/i })).toBeInTheDocument()
    // Accessible step announcement.
    expect(screen.getByText(/step 1 of 5: amount/i)).toBeInTheDocument()
  })

  it('advances from Amount to Designation on Continue', async () => {
    const user = userEvent.setup()
    renderForm()
    // Default amount (100) makes Continue actionable.
    await user.click(screen.getByRole('button', { name: /continue/i }))
    expect(screen.getByRole('heading', { name: /where should it go/i })).toBeInTheDocument()
    // Seeded projects appear as designation options.
    expect(screen.getByText('The Main House')).toBeInTheDocument()
    expect(screen.getByText('The Onion Barn')).toBeInTheDocument()
  })

  it('lets the donor go Back from Designation to Amount', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: /continue/i }))
    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByRole('heading', { name: /choose an amount/i })).toBeInTheDocument()
  })

  it('disables Continue when the custom amount clears the preset to 0', async () => {
    const user = userEvent.setup()
    renderForm()
    const custom = screen.getByPlaceholderText('0')
    await user.type(custom, '0')
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
  })

  it('accepts a custom amount and continues', async () => {
    const user = userEvent.setup()
    renderForm()
    const custom = screen.getByPlaceholderText('0')
    await user.type(custom, '275')
    await user.click(screen.getByRole('button', { name: /continue/i }))
    expect(screen.getByRole('heading', { name: /where should it go/i })).toBeInTheDocument()
  })

  it('gates the Review step until name and a valid email are provided', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: /continue/i })) // → Designation
    await user.click(screen.getByRole('button', { name: /continue/i })) // → Your details

    const reviewBtn = screen.getByRole('button', { name: /review gift/i })
    expect(reviewBtn).toBeDisabled()

    await user.type(screen.getByPlaceholderText('Jane McArthur Hill'), 'Jane')
    expect(reviewBtn).toBeDisabled() // email still missing

    await user.type(screen.getByPlaceholderText('jane@example.com'), 'not-an-email')
    expect(reviewBtn).toBeDisabled() // invalid email

    await user.clear(screen.getByPlaceholderText('jane@example.com'))
    await user.type(screen.getByPlaceholderText('jane@example.com'), 'jane@example.com')
    expect(reviewBtn).toBeEnabled()
  })

  it('walks the full happy path to the thank-you step (no real payment)', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: /continue/i }))   // Amount → Designation
    await user.click(screen.getByRole('button', { name: /continue/i }))   // Designation → Details
    await user.type(screen.getByPlaceholderText('Jane McArthur Hill'), 'Jane Donor')
    await user.type(screen.getByPlaceholderText('jane@example.com'), 'jane@example.com')
    await user.click(screen.getByRole('button', { name: /review gift/i })) // Details → Review
    expect(screen.getByRole('heading', { name: /review your gift/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /confirm gift/i })) // Review → Thanks
    expect(screen.getByText(/thank you/i)).toBeInTheDocument()
    expect(screen.getByText(/Jane\./)).toBeInTheDocument()
  })
})
