import { render, screen } from '@testing-library/react'
import { StatusBadge } from '@/components/status-badge'

describe('StatusBadge', () => {
  it('renders the status text', () => {
    render(<StatusBadge status="Sent" />)
    expect(screen.getByText('Sent')).toBeInTheDocument()
  })

  it('renders with different status values', () => {
    const { rerender } = render(<StatusBadge status="Pending" />)
    expect(screen.getByText('Pending')).toBeInTheDocument()

    rerender(<StatusBadge status="Failed" />)
    expect(screen.getByText('Failed')).toBeInTheDocument()
  })

  it('renders with unknown status', () => {
    render(<StatusBadge status="Unknown" />)
    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })

  it('applies additional className', () => {
    render(<StatusBadge status="Sent" className="extra-class" />)
    const badge = screen.getByText('Sent')
    expect(badge.className).toContain('extra-class')
  })
})
