import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/input'

describe('Input', () => {
  it('renders and accepts input', async () => {
    const handleChange = vi.fn()
    render(<Input placeholder="Enter name" onChange={handleChange} />)
    const input = screen.getByPlaceholderText('Enter name')
    await userEvent.type(input, 'John')
    expect(handleChange).toHaveBeenCalled()
  })

  it('renders disabled state', () => {
    render(<Input disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })
})
