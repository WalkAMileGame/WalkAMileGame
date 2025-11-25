import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import SpectatorTeamSelection from '../components/SpectatorTeamSelection';

// Mock the API_BASE
vi.mock('../api', () => ({
  API_BASE: 'http://localhost:8000/api'
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('SpectatorTeamSelection Component', () => {
  const mockBoardConfig = {
    name: 'Test Board',
    ringData: [{ id: 1, name: 'Ring 1', sectors: [] }]
  };

  const mockRoomData = {
    room_code: 'TEST123',
    board_config: mockBoardConfig,
    game_started: true,
    teams: [
      { team_name: 'Team Alpha', circumstance: 'First circumstance' },
      { team_name: 'Team Beta', circumstance: 'Second circumstance' },
      { team_name: 'Team Gamma', circumstance: '' }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={['/spectate/TEST123']}>
        <Routes>
          <Route path="/spectate/:gamecode" element={<SpectatorTeamSelection />} />
        </Routes>
      </MemoryRouter>
    );
  };

  const setupFetchMock = (responses) => {
    global.fetch.mockImplementation((url) => {
      for (const [pattern, response] of Object.entries(responses)) {
        if (url.includes(pattern)) {
          return Promise.resolve(response);
        }
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
  };

  test('renders loading state initially', () => {
    setupFetchMock({
      '/rooms/TEST123': { ok: true, json: async () => mockRoomData }
    });

    renderComponent();
    expect(screen.getByText('Loading game data...')).toBeInTheDocument();
  });

  test('displays team selection with game code and teams', async () => {
    setupFetchMock({
      '/rooms/TEST123': { ok: true, json: async () => mockRoomData }
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByText('Spectate Game')).toBeInTheDocument();
      expect(screen.getByText(/Game Code: TEST123/)).toBeInTheDocument();
      expect(screen.getByText('Select a team to spectate:')).toBeInTheDocument();
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      expect(screen.getByText('Team Beta')).toBeInTheDocument();
      expect(screen.getByText('Team Gamma')).toBeInTheDocument();
    });
  });

  test('displays team circumstances correctly', async () => {
    setupFetchMock({
      '/rooms/TEST123': { ok: true, json: async () => mockRoomData }
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByText('First circumstance')).toBeInTheDocument();
      expect(screen.getByText('Second circumstance')).toBeInTheDocument();
      expect(screen.getByText('No circumstance set')).toBeInTheDocument();
    });
  });

  test('shows correct number of spectate buttons', async () => {
    setupFetchMock({
      '/rooms/TEST123': { ok: true, json: async () => mockRoomData }
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      const spectateButtons = screen.getAllByText('Spectate');
      expect(spectateButtons).toHaveLength(3);
    });
  });

  test('navigates to game view when team card is clicked', async () => {
    setupFetchMock({
      '/rooms/TEST123': { ok: true, json: async () => mockRoomData }
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    });

    const teamCards = screen.getAllByText('Team Alpha')[0].closest('.team-card');

    await act(async () => {
      fireEvent.click(teamCards);
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      '/game/TEST123/Team Alpha',
      {
        state: {
          boardConfig: mockBoardConfig,
          teamName: 'Team Alpha',
          isSpectator: true
        }
      }
    );
  });

  test('navigates to game view when spectate button is clicked', async () => {
    setupFetchMock({
      '/rooms/TEST123': { ok: true, json: async () => mockRoomData }
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByText('Team Beta')).toBeInTheDocument();
    });

    const spectateButtons = screen.getAllByText('Spectate');

    await act(async () => {
      fireEvent.click(spectateButtons[1]);
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      '/game/TEST123/Team Beta',
      expect.objectContaining({
        state: expect.objectContaining({
          boardConfig: mockBoardConfig,
          teamName: 'Team Beta',
          isSpectator: true
        })
      })
    );
  });

  test('displays "Back to Home" button', async () => {
    setupFetchMock({
      '/rooms/TEST123': { ok: true, json: async () => mockRoomData }
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByText('Back to Home')).toBeInTheDocument();
    });
  });

  test('navigates to home when "Back to Home" is clicked', async () => {
    setupFetchMock({
      '/rooms/TEST123': { ok: true, json: async () => mockRoomData }
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByText('Back to Home')).toBeInTheDocument();
    });

    const backButton = screen.getByText('Back to Home');

    await act(async () => {
      fireEvent.click(backButton);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('redirects to waiting room if game has not started', async () => {
    const roomNotStarted = { ...mockRoomData, game_started: false };

    setupFetchMock({
      '/rooms/TEST123': { ok: true, json: async () => roomNotStarted }
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/waiting/TEST123');
    });
  });

  test('displays error when room not found', async () => {
    setupFetchMock({
      '/rooms/TEST123': { ok: false, status: 404 }
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Room not found')).toBeInTheDocument();
    });
  });

  test('displays "Back to Home" button in error state', async () => {
    setupFetchMock({
      '/rooms/TEST123': { ok: false, status: 404 }
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByText('Back to Home')).toBeInTheDocument();
    });

    const backButton = screen.getByText('Back to Home');

    await act(async () => {
      fireEvent.click(backButton);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('displays message when no teams exist', async () => {
    const roomWithNoTeams = { ...mockRoomData, teams: [] };

    setupFetchMock({
      '/rooms/TEST123': { ok: true, json: async () => roomWithNoTeams }
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByText('No teams available to spectate')).toBeInTheDocument();
    });
  });

  test('handles fetch errors gracefully', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'));

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  test('displays all teams in grid layout', async () => {
    setupFetchMock({
      '/rooms/TEST123': { ok: true, json: async () => mockRoomData }
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      const teamCards = document.querySelectorAll('.team-card');
      expect(teamCards).toHaveLength(3);
    });
  });

  test('team cards have correct structure', async () => {
    setupFetchMock({
      '/rooms/TEST123': { ok: true, json: async () => mockRoomData }
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      const teamCard = document.querySelector('.team-card');
      expect(teamCard).toBeInTheDocument();
      expect(teamCard.querySelector('.team-name')).toBeInTheDocument();
      expect(teamCard.querySelector('.team-circumstance')).toBeInTheDocument();
      expect(teamCard.querySelector('.btn-spectate')).toBeInTheDocument();
    });
  });
});
