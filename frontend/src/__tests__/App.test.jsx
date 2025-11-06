/* global global */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '../context/AuthContext';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const mockEnergy = {values: 32}

describe("App", () => {
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

  test('renders content', async () => {
      const { default: App } = await import("../App");
      render(<App />)
  
      const _element1 = screen.getByText('Home')
      const _element3 = screen.getByText('Login')
  })
  
  test('clicking login button renders login page', async () => {
    const { default: App } = await import("../App");
    render(
    <AuthProvider>
      <App />
    </AuthProvider>
    )
  
    const user = userEvent.setup()
    const button = screen.getByText('Login')
    await user.click(button)
  
    const linkElement = screen.getByText(/Email Address/)
  
    expect(linkElement).toBeInTheDocument()
  })
  
  
  test('clicking login and then home button renders homepage', async () => {
    const { default: App } = await import("../App");
    render(
      <AuthProvider>
      <App />
    </AuthProvider>
    )
  
    const user = userEvent.setup()
    const button1 = screen.getByRole('button', { name: 'Login' });
    await user.click(button1)
  
    const button2 = screen.getByText('Home')
    await user.click(button2)
  
    const _element = screen.getByText('WALK A MILE:')
  })
});


test('logged in user sees their email and logout button', async () => {
  vi.resetModules();

  vi.doMock("../context/AuthContext", async () => {
  const actual = await vi.importActual("../context/AuthContext");
  return {
    ...actual,
    useAuth: () => ({
      user: { email: "test@example.com" },
      logout: vi.fn(),
    }),
    AuthProvider: ({ children }) => <>{children}</>,
  };
});

   const { default: App } = await import("../App");

  render(
      <App />
  )
  
  expect(screen.getByText("test@example.com")).toBeInTheDocument();

  expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();

  vi.resetModules(); 

})