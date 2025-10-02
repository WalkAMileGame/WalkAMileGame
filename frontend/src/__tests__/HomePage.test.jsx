import { render, screen } from '@testing-library/react'
import HomePage from '../components/HomePage'

test('renders content', () => {

    render(<HomePage />)

    const element1 = screen.getByText('The Wheel Homepage')
    const element2 = screen.getByText('Welocme to the Walk a Mile game')
})