import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "../../context/ProtectedRoute";
import { useAuth } from '../../context/AuthContext';

vi.mock('../../context/AuthContext', () => ({
    useAuth: vi.fn()
}));

describe("ProtectedRoute", () => {
  afterEach(() => vi.clearAllMocks());

  it("redirects to /login when user is null", () => {
    useAuth.mockReturnValue({ user: null, loading: false });

    render(
      <MemoryRouter initialEntries={["/landing"]}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={["admin", "gamemaster"]} />}>
            <Route path="/landing" element={<div>Landing</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Login Page/i)).toBeInTheDocument();
  });

  it("shows children when user is authenticated", () => {
    useAuth.mockReturnValue({
      user: { email: "test@example.com", role: "admin" },
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={["/landing"]}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={["admin", "gamemaster"]} />}>
            <Route path="/landing" element={<div>Landing</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Landing/i)).toBeInTheDocument();
  });

  it("redirects to /unauthorized when role not allowed", () => {
    useAuth.mockReturnValue({
      user: { email: "user@example.com", role: "gamemaster" },
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={["/landing"]}>
        <Routes>
          <Route
            element={<ProtectedRoute allowedRoles={["admin"]} />}
          >
            <Route path="/landing" element={<div>Edit Users</div>} />
          </Route>
          <Route path="/unauthorized" element={<div>Unauthorized</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Unauthorized/i)).toBeInTheDocument();
  });
});