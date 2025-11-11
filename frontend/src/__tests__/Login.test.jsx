import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../components/Login';
import { useAuth } from '../context/AuthContext';
import { expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';


vi.mock('../api', () => ({
  API_BASE: 'http://fake-api.com',
}));

// Mock the entire AuthContext module
vi.mock('../context/AuthContext', async (importActual) => {
  const actual = await importActual();
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

const mockNavigate = vi.fn();

// Mock react-router-dom to use the spy
vi.mock('react-router-dom', async (importActual) => {
  const actual = await importActual();
  return {
    ...actual,
    useNavigate: () => mockNavigate, // <-- Add this
  };
});

// Create a spy function for 'login'
const mockLogin = vi.fn();
const mockRegister = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();

  // Set the mock implementation for useAuth
  useAuth.mockReturnValue({
    user: null,
    login: mockLogin,
    register: mockRegister,
    logout: vi.fn(),
    error: null,
    loading: false,
    setError: vi.fn(),
    authedFetch: vi.fn(),
  });

  // Mock successful fetch response for registration
  vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({ message: 'Success' }),
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

  expect(mockLogin).toHaveBeenCalledTimes(1);

  expect(mockLogin).toHaveBeenCalledWith(
    'test@example.com',
    'salainensalasana123'
  );
});


test('renders register form', async () => {
const user = userEvent.setup();

  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  await user.click(screen.getByRole('button', { name: /Register/i }));

  const linkElement = screen.getByText(/Confirm Password/i);
  expect(linkElement).toBeInTheDocument();
});


test('shows success message after successful registration', async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  await user.click(screen.getByRole('button', { name: /Register/i }));

  await user.type(screen.getByLabelText(/email address/i), 'test@email.com');
  await user.type(screen.getByLabelText(/^Password$/i), 'password123');
  await user.type(screen.getByLabelText(/confirm password/i), 'password123');

  const submitButton = screen.getAllByRole('button', { name: /Register/i }).find(
    (btn) => btn.type === 'submit'
  );
  await user.click(submitButton)

  expect(await screen.findByRole('heading', { name: /Success!/i })).toBeInTheDocument();

  expect(
    screen.getByText(/Your account creation request is successful!/i)
  ).toBeInTheDocument();

  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledWith('http://fake-api.com/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@email.com', password: 'password123' }),
  });
});


test('shows error message when login information missing', async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  await user.type(screen.getByLabelText(/email address/i), 'test@email.com');

  const submitButton = screen.getAllByRole('button', { name: /Login/i }).find(
    (btn) => btn.type === 'submit'
  );
  await user.click(submitButton)

  expect(
    await screen.findByText(/Please enter both email and password./i)
  ).toBeInTheDocument();
});


test('shows error message when register information missing', async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  await user.click(screen.getByRole('button', { name: /Register/i }));

  await user.type(screen.getByLabelText(/email address/i), 'test@email.com');

  const submitButton = screen.getAllByRole('button', { name: /Register/i }).find(
    (btn) => btn.type === 'submit'
  );
  await user.click(submitButton)

  expect(
    await screen.findByText(/Please fill out all fields./i)
  ).toBeInTheDocument();
});


test('shows error message when register passwords do not match', async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  await user.click(screen.getByRole('button', { name: /Register/i }));

  await user.type(screen.getByLabelText(/email address/i), 'test@email.com');
  await user.type(screen.getByLabelText(/^Password$/i), 'password123');
  await user.type(screen.getByLabelText(/confirm password/i), 'password132');

  const submitButton = screen.getAllByRole('button', { name: /Register/i }).find(
    (btn) => btn.type === 'submit'
  );
  await user.click(submitButton)

  expect(
    await screen.findByText(/Passwords do not match./i)
  ).toBeInTheDocument();
});


test('shows server error message when registration fails', async () => {
  const user = userEvent.setup();

  vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: false,
    json: vi.fn().mockResolvedValue({ detail: "Email already in use" }),
  });

  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  await user.click(screen.getByRole('button', { name: /Register/i }));

  await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
  await user.type(screen.getByLabelText(/^Password$/i), 'password123');
  await user.type(screen.getByLabelText(/confirm password/i), 'password123');

  const submitButton = screen.getAllByRole('button', { name: /Register/i }).find(
    (btn) => btn.type === 'submit'
  );
  await user.click(submitButton);

  expect(await screen.findByText("Email already in use")).toBeInTheDocument();
});


test('shows error message when login function throws an error', async () => {
  const user = userEvent.setup();
  const errorMessage = "Invalid credentials from server";

  mockLogin.mockRejectedValueOnce(new Error(errorMessage));

  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
  await user.type(screen.getByLabelText(/^Password$/i), 'password123');

  const submitButton = screen.getAllByRole('button', { name: /Login/i }).find(
    (btn) => btn.type === 'submit'
  );
  await user.click(submitButton);

  expect(await screen.findByText(errorMessage)).toBeInTheDocument();
});


test('calls logout and navigates to root on logout', async () => {
  const user = userEvent.setup();
  const mockLogout = vi.fn();

  useAuth.mockReturnValue({
    user: { email: 'test@example.com' },
    login: mockLogin,
    register: mockRegister,
    logout: mockLogout, // <-- Use the new spy
    error: null,
    setError: vi.fn(),
  });

  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  expect(screen.getByText(/Welcome!/i)).toBeInTheDocument();

  const logoutButton = screen.getByRole('button', { name: /logout/i });
  await user.click(logoutButton);

  expect(mockLogout).toHaveBeenCalledTimes(1);
  expect(mockNavigate).toHaveBeenCalledWith('/');
});
