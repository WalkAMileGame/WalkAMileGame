import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../components/Login';
import { useAuth } from '../context/AuthContext';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';



// Mock the entire AuthContext module
vi.mock('../context/AuthContext', async (importActual) => {
  const actual = await importActual();
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

// Create a spy function for 'login'
const mockLogin = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();

  // Set the mock implementation for useAuth
  useAuth.mockReturnValue({
    user: null,
    login: mockLogin,
    logout: vi.fn(),
    error: null,
    loading: false,
    setError: vi.fn(),
    authedFetch: vi.fn(),
  });
});

test('renders login form', () => {
  render(
  <MemoryRouter>
    <Login />
  </MemoryRouter>
);
  const linkElement = screen.getByText(/Email Address/);
  expect(linkElement).toBeInTheDocument();
});

test('form calls login submission handler with correct credentials', async () => {
  const user = userEvent.setup();

  render(
  <MemoryRouter>
    <Login />
  </MemoryRouter>
  );

  await user.type(screen.getByLabelText(/email/i), 'test@example.com');
  await user.type(screen.getByLabelText(/password/i), 'salainensalasana123');

  await user.click(screen.getByRole('button', { name: /login/i }));

    ///expect(handleSubmit).toHaveBeenCalledTimes(1)
    ///expect(handleSubmit).toHaveBeenCalledWith({
    ///    email: 'test@example.com',
    ///    password: 'salainensalasana123',
    ///})
})

  expect(mockLogin).toHaveBeenCalledWith(
    'test@example.com',
    'salainensalasana123'
  );
});
