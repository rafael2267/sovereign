import { render, screen, fireEvent } from '@testing-library/react'
import { NetworkSelector } from '@/components/NetworkSelector'

describe('NetworkSelector', () => {
  it('renders 5 main network buttons', () => {
    const onSelect = jest.fn()
    render(<NetworkSelector selected={null} onSelect={onSelect} />)
    expect(screen.getByText('Instagram')).toBeInTheDocument()
    expect(screen.getByText('X / Twitter')).toBeInTheDocument()
    expect(screen.getByText('TikTok')).toBeInTheDocument()
    expect(screen.getByText('YouTube')).toBeInTheDocument()
    expect(screen.getByText('Twitch')).toBeInTheDocument()
  })

  it('does not show More networks by default', () => {
    render(<NetworkSelector selected={null} onSelect={jest.fn()} />)
    expect(screen.queryByText('Bluesky')).not.toBeInTheDocument()
  })

  it('shows More networks after clicking More button', () => {
    render(<NetworkSelector selected={null} onSelect={jest.fn()} />)
    fireEvent.click(screen.getByText('More'))
    expect(screen.getByText('Bluesky')).toBeInTheDocument()
    expect(screen.getByText('Discord')).toBeInTheDocument()
  })

  it('calls onSelect with network id when a network is clicked', () => {
    const onSelect = jest.fn()
    render(<NetworkSelector selected={null} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('Instagram'))
    expect(onSelect).toHaveBeenCalledWith('instagram')
  })

  it('highlights the selected network', () => {
    const { container } = render(<NetworkSelector selected="instagram" onSelect={jest.fn()} />)
    const instagramBtn = container.querySelector('[data-network="instagram"]')
    expect(instagramBtn).toHaveClass('border-gold')
  })
})
