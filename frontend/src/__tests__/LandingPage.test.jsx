import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import LandingPage from '../components/LandingPage'
import { vi } from 'vitest';


vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'test@example.com', role: "admin" },
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));


test('renders content', () => {

    render(
    <MemoryRouter>
        <LandingPage />
    </MemoryRouter>
  );

    expect(screen.getByText('DASHBOARD')).toBeInTheDocument();
    expect(screen.getByText('EDIT GAMEBOARDS')).toBeInTheDocument();
    expect(screen.getByText('HOST A GAME')).toBeInTheDocument();
    expect(screen.getByText('MANAGE USERS')).toBeInTheDocument();
});

test('takes edit gameboard site', async () => {
    const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/gameboard" element={<div>Remaining energypoints:</div>} />
        <Route path="/hostgame" element={<div>Host a Game</div>} />
      </Routes>
    </MemoryRouter>
  );
    const editgamebtn = screen.getByRole('button', { name: 'Edit' });
    const hostgaembtn = screen.getByRole('button', { name: 'Host' });
    const manageusersbtn = screen.getByRole('button', { name: 'Manage' });

    expect(editgamebtn).toBeInTheDocument();
    expect(hostgaembtn).toBeInTheDocument();
    expect(manageusersbtn).toBeInTheDocument();

    await user.click(editgamebtn);
    expect(screen.getByText('Remaining energypoints:')).toBeInTheDocument();
});


test('takes hosting site', async () => {
    const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/hostgame" element={<div>Host a Game</div>} />
      </Routes>
    </MemoryRouter>
  );
    const hostgaembtn = screen.getByRole('button', { name: 'Host' });

    expect(hostgaembtn).toBeInTheDocument();

    await user.click(hostgaembtn);
    expect(screen.getByText(/host a game/i)).toBeInTheDocument();

});


test('takes edit users site', async () => {
    const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/edit_users" element={<div>Existing users</div>} />
      </Routes>
    </MemoryRouter>
  );
    const managebtn = screen.getByRole('button', { name: 'Manage' });

    expect(managebtn).toBeInTheDocument();

    await user.click(managebtn);
    expect(screen.getByText(/existing users/i)).toBeInTheDocument();

});