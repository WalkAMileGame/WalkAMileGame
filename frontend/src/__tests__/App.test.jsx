/* global global */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App';
import { AuthProvider } from '../context/AuthContext';

const mockEnergy = {values: 32}

// Helper to render the full app
const renderApp = () => {
  return render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
};

describe("GameBoardSettings", () => {

  beforeAll(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockEnergy),
      })
    );
  });

  afterAll(() => {
    global.fetch.mockRestore?.();
  });

  test('renders content', () => {
  
      render(<App />)
  
      const _element1 = screen.getByText('Home')
      const _element2 = screen.getByText('Gameboard')
      const _element3 = screen.getByText('Login')
  })
  
  test('clicking login button renders login page', async () => {
  
    renderApp()
  
    const user = userEvent.setup()
    const button = screen.getByText('Login')
    await user.click(button)
  
    const linkElement = screen.getByText(/Email Address/)
  
    expect(linkElement).toBeInTheDocument()
  })
  
  test('clicking gameboard button renders gameboard', async () => {
  
    renderApp()
  
    const user = userEvent.setup()
    const button = screen.getByText('Gameboard')
    await user.click(button)
  
    const _element = screen.getByText('Remaining energypoints:', {exact: false})
  })
  
  test('clicking login and then home button renders homepage', async () => {
  
    renderApp()
  
    const user = userEvent.setup()
    const button1 = screen.getByText('Gameboard')
    await user.click(button1)
  
    const button2 = screen.getByText('Home')
    await user.click(button2)
  
    const _element = screen.getByText('WALK A MILE:')
  })
});
