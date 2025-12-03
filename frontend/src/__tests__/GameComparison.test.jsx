import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import GameComparison from '../components/GameComparison';

// Mock the AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'test@test.com', role: 'user' },
    authFetch: async (endpoint, options = {}) => {
      return await global.fetch(`http://localhost:8000/api${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        }
      });
    },
  }),
}));

// Mock the API_BASE
vi.mock('../api', () => ({
  API_BASE: 'http://localhost:8000/api'
}));

// Mock the EnergyMarkers component
vi.mock('../components/ui/EnergyMarkers', () => ({
  default: () => <g data-testid="energy-markers"></g>
}));

// Mock the ZoomControls component
vi.mock('../components/ui/ZoomControls', () => ({
  default: () => <div data-testid="zoom-controls"></div>
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

describe('GameComparison Component', () => {
  const mockBoardConfig = {
    ringData: [
      {
        id: 'ring0',
        innerRadius: 200,
        outerRadius: 300,
        labels: [
          { id: 'label1', text: 'Test Label 1', color: '#ff0000', tileType: 'normal', energypoint: false },
          { id: 'label2', text: 'Test Label 2', color: '#00ff00', tileType: 'ring_title', energypoint: true }
        ]
      }
    ]
  };

  const mockRoomData = {
    room_code: 'TEST123',
    teams: [
      { team_name: 'Team Alpha', circumstance: 'Test circumstance', current_energy: 5 },
      { team_name: 'Team Beta', circumstance: 'Another circumstance', current_energy: 3 }
    ]
  };

  const mockMistakes = {
    mistakes: [
      { ring_id: 'ring0', label_id: 'label1' }
    ]
  };

  let container;
  const realSetInterval = global.setInterval;
  const realClearInterval = global.clearInterval;
  const intervals = [];
  const originalError = console.error;

  beforeEach(() => {
    vi.clearAllMocks();
    intervals.length = 0;

    // Suppress act() warnings - these are false positives from polling intervals
    // that are properly cleaned up but trigger during async test operations
    console.error = (...args) => {
      if (
        typeof args[0] === 'string' &&
        (args[0].includes('Warning: An update to') ||
         args[0].includes('was not wrapped in act'))
      ) {
        return;
      }
      originalError.call(console, ...args);
    };

    // Mock setInterval to track intervals
    global.setInterval = vi.fn((fn, delay) => {
      const id = realSetInterval(fn, delay);
      intervals.push(id);
      return id;
    });

    // Mock clearInterval to remove from tracking
    global.clearInterval = vi.fn((id) => {
      const index = intervals.indexOf(id);
      if (index > -1) {
        intervals.splice(index, 1);
      }
      realClearInterval(id);
    });

    global.fetch = vi.fn();
    window.alert = vi.fn();
    window.confirm = vi.fn();
    delete window.location;
    window.location = { href: '' };
  });

  afterEach(() => {
    // Clear all tracked intervals
    intervals.forEach(id => realClearInterval(id));
    intervals.length = 0;

    // Restore real implementations
    global.setInterval = realSetInterval;
    global.clearInterval = realClearInterval;
    console.error = originalError;

    if (container && container.unmount) {
      container.unmount();
    }
    container = null;
  });

  const renderComponent = (isGamemaster = false) => {
    const result = render(
      <MemoryRouter initialEntries={[{ pathname: '/comparison/TEST123', state: { isGamemaster } }]}>
        <Routes>
          <Route path="/comparison/:gamecode" element={<GameComparison />} />
        </Routes>
      </MemoryRouter>
    );
    container = result;
    return result;
  };

  const setupFetchMock = (responses) => {
    global.fetch.mockImplementation((url, options) => {
      // Sort patterns by length (longest first) to match most specific patterns first
      const sortedPatterns = Object.entries(responses).sort((a, b) => b[0].length - a[0].length);

      for (const [pattern, response] of sortedPatterns) {
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
    expect(screen.getByText('Loading comparison...')).toBeInTheDocument();
  });

  test('displays comparison page with room data', async () => {
    setupFetchMock({
      '/rooms/TEST123': { ok: true, json: async () => mockRoomData },
      '/rooms/TEST123/teams/Team Alpha/board': { ok: true, json: async () => mockBoardConfig },
      '/rooms/TEST123/teams/Team Alpha/mistakes': { ok: true, json: async () => mockMistakes },
      '/rooms/TEST123/teams/Team Beta/board': { ok: true, json: async () => mockBoardConfig },
      '/rooms/TEST123/teams/Team Beta/mistakes': { ok: true, json: async () => ({ mistakes: [] }) }
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Game Comparison')).toBeInTheDocument();
    });
  });

  test('initially shows single board view', async () => {
    setupFetchMock({
      '/rooms/TEST123': { ok: true, json: async () => mockRoomData },
      '/rooms/TEST123/teams/Team Alpha/board': { ok: true, json: async () => mockBoardConfig },
      '/rooms/TEST123/teams/Team Alpha/mistakes': { ok: true, json: async () => mockMistakes }
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Your Team:')).toBeInTheDocument();
      expect(screen.getByText('Compare with Others')).toBeInTheDocument();
    });
  });

  test('toggles to comparison mode when button is clicked', async () => {
    setupFetchMock({
      '/rooms/TEST123': { ok: true, json: async () => mockRoomData },
      '/rooms/TEST123/teams/Team Alpha/board': { ok: true, json: async () => mockBoardConfig },
      '/rooms/TEST123/teams/Team Alpha/mistakes': { ok: true, json: async () => mockMistakes },
      '/rooms/TEST123/teams/Team Beta/board': { ok: true, json: async () => mockBoardConfig },
      '/rooms/TEST123/teams/Team Beta/mistakes': { ok: true, json: async () => ({ mistakes: [] }) }
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Compare with Others')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Compare with Others'));

    await waitFor(() => {
      expect(screen.getByText('Show Only My Board')).toBeInTheDocument();
      expect(screen.getByText('Left Board:')).toBeInTheDocument();
      expect(screen.getByText('Right Board:')).toBeInTheDocument();
    });
  });

  test('displays team stats correctly', async () => {
    setupFetchMock({
      '/rooms/TEST123': { ok: true, json: async () => mockRoomData },
      '/rooms/TEST123/teams/Team Alpha/board': { ok: true, json: async () => mockBoardConfig },
      '/rooms/TEST123/teams/Team Alpha/mistakes': { ok: true, json: async () => mockMistakes }
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Circumstance: Test circumstance/)).toBeInTheDocument();
      expect(screen.getByText(/Energy: 5/)).toBeInTheDocument();
      expect(screen.getByText(/Mistakes: 1/)).toBeInTheDocument();
    });
  });

  test('shows close game button for gamemaster', async () => {
    setupFetchMock({
      '/rooms/TEST123': { ok: true, json: async () => mockRoomData },
      '/rooms/TEST123/teams/Team Alpha/board': { ok: true, json: async () => mockBoardConfig },
      '/rooms/TEST123/teams/Team Alpha/mistakes': { ok: true, json: async () => mockMistakes }
    });

    renderComponent(true);

    await waitFor(() => {
      expect(screen.getByText('Close Game & Delete Room')).toBeInTheDocument();
    });
  });

  test('shows return home button for non-gamemaster', async () => {
    setupFetchMock({
      '/rooms/TEST123': { ok: true, json: async () => mockRoomData },
      '/rooms/TEST123/teams/Team Alpha/board': { ok: true, json: async () => mockBoardConfig },
      '/rooms/TEST123/teams/Team Alpha/mistakes': { ok: true, json: async () => mockMistakes }
    });

    renderComponent(false);

    await waitFor(() => {
      expect(screen.getByText('Return to Home')).toBeInTheDocument();
    });
  });

  test('handles close game confirmation', async () => {
    window.confirm.mockReturnValue(true);
    setupFetchMock({
      '/rooms/TEST123': { ok: true, json: async () => mockRoomData },
      '/rooms/TEST123/teams/Team Alpha/board': { ok: true, json: async () => mockBoardConfig },
      '/rooms/TEST123/teams/Team Alpha/mistakes': { ok: true, json: async () => mockMistakes }
    });

    renderComponent(true);

    await waitFor(() => {
      expect(screen.getByText('Close Game & Delete Room')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Close Game & Delete Room'));

    expect(window.confirm).toHaveBeenCalled();
  });

  test('displays error when no teams are found', async () => {
    setupFetchMock({
      '/rooms/TEST123': { ok: true, json: async () => ({ room_code: 'TEST123', teams: [] }) }
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No teams found in this game.')).toBeInTheDocument();
    });
  });

  test('renders zoom controls', async () => {
    setupFetchMock({
      '/rooms/TEST123': { ok: true, json: async () => mockRoomData },
      '/rooms/TEST123/teams/Team Alpha/board': { ok: true, json: async () => mockBoardConfig },
      '/rooms/TEST123/teams/Team Alpha/mistakes': { ok: true, json: async () => mockMistakes }
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByTestId('zoom-controls').length).toBeGreaterThan(0);
    });
  });
});
