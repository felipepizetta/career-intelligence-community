import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Home from '@/app/page'

describe('Landing Page', () => {
    it('renders the main heading', () => {
        render(<Home />)

        // Check if the logo/text is generally there
        expect(screen.getByText('Career Intelligence Platform')).toBeInTheDocument()

        // Check for the main hero text
        expect(screen.getByText(/LinkedIn Content/i)).toBeInTheDocument()
        expect(screen.getByText(/Delivered/i)).toBeInTheDocument()
    })

    it('renders the call to action buttons', () => {
        render(<Home />)

        const startButton = screen.getByRole('link', { name: /Start Generating Now/i })
        expect(startButton).toBeInTheDocument()
        expect(startButton).toHaveAttribute('href', '/login')
    })
})
