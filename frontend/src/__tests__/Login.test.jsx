import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../components/Login';

test('renders login form', () => {
    render(<Login />)

    const linkElement = screen.getByText(/Email Address/)

    expect(linkElement).toBeInTheDocument()
})

test ('form calls login submission handler with correct credentials', async () => {
    const handleSubmit = vi.fn()
    const user = userEvent.setup()
    render (<Login onSubmit={handleSubmit}/>)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'salainensalasana123')
    await user.click(screen.getByRole('button', {name: /login/i}))

    expect(handleSubmit).toHaveBeenCalledTimes(1)
    expect(handleSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'salainensalasana123',
    })
})

