import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../components/Login';
import { useAuth } from '../context/AuthContext';
import { expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { waitFor } from '@testing-library/react';


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

  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ message: "ok" })
    })
  );

  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  await user.click(screen.getByRole('button', { name: /Register/i }));

  await user.type(screen.getByLabelText(/Registration code/i), 'ABCD');
  await user.type(screen.getByLabelText(/^Email Address$/i), 'test@email.com');
  await user.type(screen.getByLabelText(/^Password$/i), 'password123');
  await user.type(screen.getByLabelText(/Confirm Password/i), 'password123');

  await user.click(screen.getByRole('button', { name: /^Register$/i }));

  expect(
    await screen.findByRole('heading', { name: /Success!/i })
  ).toBeInTheDocument();

  expect(
    screen.getByText(/Your account creation request is successful!/i)
  ).toBeInTheDocument();

  expect(global.fetch).toHaveBeenCalledTimes(1);
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

  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ detail: "Passwords do not match" })
    })
  );

  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );


  await user.click(screen.getByRole("button", { name: /register/i }));

  await user.type(screen.getByLabelText(/Registration code/i), "ABCD");
  await user.type(screen.getByLabelText(/^Email Address$/i), "test@email.com");
  await user.type(screen.getByLabelText(/^Password$/i), "password1");
  await user.type(screen.getByLabelText(/Confirm Password/i), "password");

  await user.click(screen.getByRole("button", { name: /^Register$/i }));

  expect(
    await screen.findByText(/Passwords do not match./i)
  ).toBeInTheDocument();
});


test("shows server error message when registration fails", async () => {
  const user = userEvent.setup();

  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ detail: "Email already in use" })
    })
  );

  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  await user.click(screen.getByRole("button", { name: /register/i }));

  await user.type(screen.getByLabelText(/Registration code/i), "ABCD");
  await user.type(screen.getByLabelText(/^Email Address$/i), "test@email.com");
  await user.type(screen.getByLabelText(/^Password$/i), "password");
  await user.type(screen.getByLabelText(/Confirm Password/i), "password");

  await user.click(screen.getByRole("button", { name: /^Register$/i }));

  expect(
    await screen.findByText(/Email already in use/i)
  ).toBeInTheDocument();
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
    logout: mockLogout,
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

test('transitions to renewal form on expired account error and submits renewal', async () => {
  const user = userEvent.setup();

  const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

  mockLogin.mockRejectedValueOnce(new Error("ACCOUNT_EXPIRED"));

  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ message: "Renewed" })
    })
  );

  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  await user.type(screen.getByLabelText(/email address/i), 'expired@test.com');
  await user.type(screen.getByLabelText(/^Password$/i), 'password123');

  const loginButton = screen.getAllByRole('button', { name: /Login/i }).find(
      (btn) => btn.type === 'submit'
  );
  await user.click(loginButton);

  expect(await screen.findByText(/Your account has expired/i)).toBeInTheDocument();

  expect(screen.getByRole('heading', { name: /Reactivate Account/i })).toBeInTheDocument();

  await user.type(screen.getByLabelText(/New Registration Code/i), 'NEW-CODE-123');

  await user.click(screen.getByRole('button', { name: /Reactivate Account/i }));

  await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining("Account successfully renewed"));
  });

  expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/renew-access'),
      expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"new_code":"NEW-CODE-123"')
      })
  );

  expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();

  alertSpy.mockRestore();
});
