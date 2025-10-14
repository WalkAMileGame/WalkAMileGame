import { render, screen } from '@testing-library/react'
import HomePage from '../components/HomePage'

test('renders content', () => {

    render(<HomePage />)

    const element1 = screen.getByText('WALK A MILE:')
    const element2 = screen.getByText('THE INTERNATIONAL PATH TO FINNISH EDUCATION')
})
