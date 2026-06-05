import { render, screen } from '@testing-library/react'
import { Sidebar } from '@/components/sidebar'

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) =>
    <a href={href} {...props}>{children}</a>,
}))

describe('Sidebar', () => {
  it('renders all navigation links', () => {
    render(<Sidebar />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Campaigns')).toBeInTheDocument()
    expect(screen.getByText('New Campaign')).toBeInTheDocument()
    expect(screen.getByText('Logs')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
  })

  it('renders the brand name', () => {
    render(<Sidebar />)
    expect(screen.getByText('Outreach AI')).toBeInTheDocument()
  })

  it('has correct link hrefs', () => {
    render(<Sidebar />)
    const links = screen.getAllByRole('link')
    const hrefs = links.map(l => l.getAttribute('href'))
    expect(hrefs).toContain('/')
    expect(hrefs).toContain('/campaigns')
    expect(hrefs).toContain('/campaigns/create')
    expect(hrefs).toContain('/logs')
    expect(hrefs).toContain('/settings')
    expect(hrefs).toContain('/profile')
  })
})
