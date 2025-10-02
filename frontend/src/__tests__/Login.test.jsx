import { render, screen } from '@testing-library/react';
import Login from '../components/Login';

test('renders login form', () => {
    render(<Login />)

    const linkElement = screen.getByText(/Email Address/)

    expect(linkElement).toBeInTheDocument()
})
