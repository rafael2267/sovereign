import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PaymentModal } from '@/components/PaymentModal'

global.fetch = jest.fn()

describe('PaymentModal', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders handle input and network selector', () => {
    render(<PaymentModal price={4700} onClose={jest.fn()} />)
    expect(screen.getByPlaceholderText(/your handle/i)).toBeInTheDocument()
    expect(screen.getByText('Instagram')).toBeInTheDocument()
  })

  it('disables pay button when handle is empty', () => {
    render(<PaymentModal price={4700} onClose={jest.fn()} />)
    expect(screen.getByRole('button', { name: /pay/i })).toBeDisabled()
  })

  it('disables pay button when no network is selected', async () => {
    render(<PaymentModal price={4700} onClose={jest.fn()} />)
    await userEvent.type(screen.getByPlaceholderText(/your handle/i), 'elonmusk')
    expect(screen.getByRole('button', { name: /pay/i })).toBeDisabled()
  })

  it('calls checkout API with handle and network on submit', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://paypal.com/approve/123' }),
    })

    render(<PaymentModal price={4700} onClose={jest.fn()} />)
    await userEvent.type(screen.getByPlaceholderText(/your handle/i), 'elonmusk')
    fireEvent.click(screen.getByText('Instagram'))
    fireEvent.click(screen.getByRole('button', { name: /pay/i }))

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/checkout', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ handle: 'elonmusk', network: 'instagram' }),
    })))
  })
})
