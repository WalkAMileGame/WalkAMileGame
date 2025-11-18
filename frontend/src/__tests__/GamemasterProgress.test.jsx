import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import GamemasterProgress from '../components/GamemasterProgress';

// Mock the API_BASE
vi.mock('../api', () => ({
  API_BASE: 'http://localhost:8000/api'
}));

// Mock the Timer component
vi.mock('../components/ui/Timer', () => ({
  default: ({ gamecode }) => <span data-testid="timer">{gamecode}</span>
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

describe('GamemasterProgress Component', () => {
  const mockBoardConfig = {
    name: 'Test Board',
    ringData: [{ id: 1, name: 'Ring 1', sectors: [] }]
  };

  const mockRoomData = {
    room_code: 'TEST123',
    board_config: mockBoardConfig,
    time_remaining: 30,
    game_paused: false,
    teams: [
      { team_name: 'Team Alpha', circumstance: 'Test circumstance' },
      { team_name: 'Team Beta', circumstance: 'Another circumstance' }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    window.alert = vi.fn();
    window.confirm = vi.fn();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={['/gamemaster/progress/TEST123']}>
        <Routes>
          <Route path="/gamemaster/progress/:gamecode" element={<GamemasterProgress />} />
        </Routes>
      </MemoryRouter>
    );
  };

  const setupFetchMock = (responses) => {
    global.fetch.mockImplementation((url, options) => {
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

  test('displays dashboard with room data and teams', async () => {
    setupFetchMock({
      '/rooms/TEST123': { ok: true, json: async () => mockRoomData }
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByText('Gamemaster Dashboard')).toBeInTheDocument();
      expect(screen.getByText(/Game Code: TEST123/)).toBeInTheDocument();
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      expect(screen.getByText('Team Beta')).toBeInTheDocument();
    });
  });

  test('shows paused indicator when game is paused', async () => {
    setupFetchMock({
      '/rooms/TEST123': {
        ok: true,
        json: async () => ({ ...mockRoomData, game_paused: true })
      }
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByText(/\(PAUSED\)/)).toBeInTheDocument();
      expect(screen.getByText('Resume')).toBeInTheDocument();
    });
  });

  test('pauses game when pause button is clicked', async () => {
    setupFetchMock({
      '/rooms/TEST123': { ok: true, json: async () => mockRoomData },
      '/pause': { ok: true, json: async () => ({}) }
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByText('Pause')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Pause'));
    });

    await waitFor(() => {
      const pauseCall = global.fetch.mock.calls.find(
        call => call[0].includes('/pause') && call[1]?.method === 'POST'
      );
      expect(pauseCall).toBeDefined();
    });
  });

  test('shows confirmation and ends game when confirmed', async () => {
    window.confirm.mockReturnValue(true);
    setupFetchMock({
      '/rooms/TEST123': { ok: true, json: async () => mockRoomData },
      '/end': { ok: true, json: async () => ({}) }
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByText('End Game')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('End Game'));
    });

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      const endCall = global.fetch.mock.calls.find(
        call => call[0].includes('/end') && call[1]?.method === 'POST'
      );
      expect(endCall).toBeDefined();
    });
  });

  test('adjusts time with positive number', async () => {
    setupFetchMock({
      '/rooms/TEST123': { ok: true, json: async () => mockRoomData },
      '/time': { ok: true, json: async () => ({}) }
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('± Min')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('± Min');
    const adjustButton = screen.getByTitle('Adjust time');

    await act(async () => {
      fireEvent.change(input, { target: { value: '10' } });
      fireEvent.click(adjustButton);
    });

    await waitFor(() => {
      const timeCall = global.fetch.mock.calls.find(
        call => call[0].includes('/time') && call[1]?.method === 'POST'
      );
      expect(timeCall).toBeDefined();
      const body = JSON.parse(timeCall[1].body);
      expect(body.time_remaining).toBe(40);
    });
  });

  test('adjusts time with negative number', async () => {
    setupFetchMock({
      '/rooms/TEST123': { ok: true, json: async () => mockRoomData },
      '/time': { ok: true, json: async () => ({}) }
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('± Min')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('± Min');
    const adjustButton = screen.getByTitle('Adjust time');

    await act(async () => {
      fireEvent.change(input, { target: { value: '-5' } });
      fireEvent.click(adjustButton);
    });

    await waitFor(() => {
      const timeCall = global.fetch.mock.calls.find(
        call => call[0].includes('/time') && call[1]?.method === 'POST'
      );
      const body = JSON.parse(timeCall[1].body);
      expect(body.time_remaining).toBe(25);
    });
  });

  test('clears input when zero is entered', async () => {
    setupFetchMock({
      '/rooms/TEST123': { ok: true, json: async () => mockRoomData }
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('± Min')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('± Min');
    const adjustButton = screen.getByTitle('Adjust time');

    await act(async () => {
      fireEvent.change(input, { target: { value: '0' } });
      fireEvent.click(adjustButton);
    });

    expect(input.value).toBe('');
  });

  test('shows alert when invalid number is entered', async () => {
    setupFetchMock({
      '/rooms/TEST123': { ok: true, json: async () => mockRoomData }
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('± Min')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('± Min');
    const adjustButton = screen.getByTitle('Adjust time');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'abc' } });
      fireEvent.click(adjustButton);
    });

    expect(window.alert).toHaveBeenCalledWith(
      'Please enter a valid number of minutes (can be negative)'
    );
  });

  test('navigates to team board when view board is clicked', async () => {
    setupFetchMock({
      '/rooms/TEST123': { ok: true, json: async () => mockRoomData }
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getAllByText('View Board')).toHaveLength(2);
    });

    const viewButtons = screen.getAllByText('View Board');

    await act(async () => {
      fireEvent.click(viewButtons[0]);
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      '/game/TEST123/Team Alpha',
      {
        state: {
          boardConfig: mockBoardConfig,
          isGamemaster: true,
          gamecode: 'TEST123'
        }
      }
    );
  });

  test('displays error state when fetch fails', async () => {
    setupFetchMock({
      '/rooms/TEST123': { ok: false, status: 404 }
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  test('polls room data every 2 seconds', async () => {
    setupFetchMock({
      '/rooms/TEST123': { ok: true, json: async () => mockRoomData }
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      const fetchCalls = global.fetch.mock.calls.filter(
        call => call[0].includes('/rooms/TEST123')
      );
      expect(fetchCalls.length).toBeGreaterThan(0);
    });

    const initialCallCount = global.fetch.mock.calls.filter(
      call => call[0].includes('/rooms/TEST123')
    ).length;

    await new Promise(resolve => setTimeout(resolve, 2500));

    await waitFor(() => {
      const pollCalls = global.fetch.mock.calls.filter(
        call => call[0].includes('/rooms/TEST123')
      );
      expect(pollCalls.length).toBeGreaterThan(initialCallCount);
    });
  });
});
