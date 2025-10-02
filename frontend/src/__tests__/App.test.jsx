import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

test('renders content', () => {

    render(<App />)

    const element1 = screen.getByText('Home')
    const element2 = screen.getByText('Gameboard')
    const element3 = screen.getByText('Login')
})

test('clicking login button renders login page', async () => {

  render(<App />)

  const user = userEvent.setup()
  const button = screen.getByText('Login')
  await user.click(button)

  const linkElement = screen.getByText(/Email Address/)

  expect(linkElement).toBeInTheDocument()
})