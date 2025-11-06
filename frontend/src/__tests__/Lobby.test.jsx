import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import Lobby from '../components/Lobby';

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

describe('Lobby Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    sessionStorage.clear();
    // FIXED: Removed vi.useFakeTimers() - causes issues with React async rendering
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // FIXED: Removed vi.useRealTimers()
  });

  // ==================== TEST DATA ====================
  
  const mockBoardConfig = {
    name: 'Test Board',
    ringData: [
      { 
        id: 1, 
        name: 'Ring 1', 
        sectors: [
          { id: 1, name: 'Sector A', cost: 5 },
          { id: 2, name: 'Sector B', cost: 3 }
        ] 
      },
      { 
        id: 2, 
        name: 'Ring 2', 
        sectors: [
          { id: 3, name: 'Sector C', cost: 8 },
          { id: 4, name: 'Sector D', cost: 6 }
        ] 
      }
    ]
  };

  const mockRoomData = {
    room_code: 'TEST123',
    gamemaster_name: 'Gamemaster',
    board_config: mockBoardConfig,
    time_remaining: 30,
    teams: [
      {
        id: 1,
        team_name: 'Team Alpha',
        circumstance: 'Test circumstance',
        current_energy: 32,
        gameboard_state: mockBoardConfig.ringData[0]
      },
      {
        id: 2,
        team_name: 'Team Beta',
        circumstance: 'Another circumstance',
        current_energy: 28,
        gameboard_state: mockBoardConfig.ringData[0]
      }
    ],
    game_started: false
  };

  // ==================== HELPER FUNCTIONS ====================
  // FIXED: Simplified router setup with single helper function

  const renderWithRouter = (component, { state = {} } = {}) => {
    return render(
      <MemoryRouter initialEntries={[{ pathname: '/lobby/TEST123', state }]}>
        <Routes>
          <Route path="/lobby/:gamecode" element={component} />
          <Route path="/game/:gamecode/:teamname" element={<div>Game View</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  const setupFetchMock = (responses) => {
    global.fetch.mockImplementation((url, options) => {
      const method = options?.method || 'GET';
      const key = `${method} ${url}`;
      
      for (const [pattern, response] of Object.entries(responses)) {
        if (key.includes(pattern) || url.includes(pattern)) {
          return Promise.resolve(response);
        }
      }
      
      // Default response
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
        text: async () => ''
      });
    });
  };

  // ==================== GAMEMASTER TESTS ====================

  describe('Gamemaster View', () => {
    test('creates room on mount with correct payload', async () => {
      setupFetchMock({
        '/rooms/create': {
          ok: true,
          json: async () => ({ 
            message: 'Room created successfully', 
            room_code: 'TEST123' 
          })
        },
        '/rooms/TEST123': {
          ok: true,
          json: async () => mockRoomData
        }
      });

      await act(async () => {
        renderWithRouter(<Lobby />, {
          state: {
            inviteCode: 'TEST123',
            isGamemaster: true,
            boardConfig: mockBoardConfig
          }
        });
      });

      await waitFor(() => {
        const createCall = global.fetch.mock.calls.find(
          call => call[0].includes('/rooms/create')
        );
        expect(createCall).toBeDefined();
      }, { timeout: 10000 });

      const createCall = global.fetch.mock.calls.find(
        call => call[0].includes('/rooms/create')
      );
      
      expect(createCall[1].method).toBe('POST');
      const body = JSON.parse(createCall[1].body);
      expect(body.room_code).toBe('TEST123');
      expect(body.board_config).toEqual(mockBoardConfig);
      expect(body.time_remaining).toBe(30);
      expect(body.teams).toEqual([]);
      expect(body.game_started).toBe(false);
    });

    test('displays gamemaster badge and lobby information', async () => {
      setupFetchMock({
        '/rooms/create': { ok: true, json: async () => ({}) },
        '/rooms/TEST123': { ok: true, json: async () => mockRoomData }
      });

      await act(async () => {
        renderWithRouter(<Lobby />, {
          state: {
            inviteCode: 'TEST123',
            isGamemaster: true,
            boardConfig: mockBoardConfig
          }
        });
      });

      expect(screen.getByText('Gamemaster')).toBeInTheDocument();
      expect(screen.getByText(/Lobby: TEST123/)).toBeInTheDocument();
      expect(screen.getByText('Time Remaining (minutes):')).toBeInTheDocument();
    });

    test('polls room data at regular intervals', async () => {
      setupFetchMock({
        '/rooms/create': { ok: true, json: async () => ({}) },
        '/rooms/TEST123': { ok: true, json: async () => mockRoomData }
      });

      await act(async () => {
        renderWithRouter(<Lobby />, {
          state: {
            inviteCode: 'TEST123',
            isGamemaster: true,
            boardConfig: mockBoardConfig
          }
        });
      });

      // Wait for initial polling to start
      await waitFor(() => {
        const pollCalls = global.fetch.mock.calls.filter(
          call => call[0].includes('/rooms/TEST123') && !call[0].includes('create')
        );
        expect(pollCalls.length).toBeGreaterThan(0);
      }, { timeout: 10000 });

      const initialCallCount = global.fetch.mock.calls.filter(
        call => call[0].includes('/rooms/TEST123') && !call[0].includes('create')
      ).length;

      // Wait for more polling
      await new Promise(resolve => setTimeout(resolve, 3000));

      await waitFor(() => {
        const pollCalls = global.fetch.mock.calls.filter(
          call => call[0].includes('/rooms/TEST123') && !call[0].includes('create')
        );
        expect(pollCalls.length).toBeGreaterThan(initialCallCount);
      }, { timeout: 10000 });
    });

    test('displays teams list with correct information', async () => {
      setupFetchMock({
        '/rooms/create': { ok: true, json: async () => ({}) },
        '/rooms/TEST123': { ok: true, json: async () => mockRoomData }
      });

      await act(async () => {
        renderWithRouter(<Lobby />, {
          state: {
            inviteCode: 'TEST123',
            isGamemaster: true,
            boardConfig: mockBoardConfig
          }
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Team Alpha')).toBeInTheDocument();
        expect(screen.getByText('Team Beta')).toBeInTheDocument();
      }, { timeout: 10000 });

      expect(screen.getByText('Test circumstance')).toBeInTheDocument();
      expect(screen.getByText('Another circumstance')).toBeInTheDocument();
    });

    test('updates time remaining successfully', async () => {
      setupFetchMock({
        '/rooms/create': { ok: true, json: async () => ({}) },
        '/rooms/TEST123': { ok: true, json: async () => mockRoomData },
        '/time': {
          ok: true,
          json: async () => ({ message: 'Time updated successfully' })
        }
      });

      await act(async () => {
        renderWithRouter(<Lobby />, {
          state: {
            inviteCode: 'TEST123',
            isGamemaster: true,
            boardConfig: mockBoardConfig
          }
        });
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('30')).toBeInTheDocument();
      }, { timeout: 10000 });

      const timeInput = screen.getByDisplayValue('30');
      
      await act(async () => {
        fireEvent.change(timeInput, { target: { value: '45' } });
      });

      const updateButton = screen.getByText('Update Time');
      
      await act(async () => {
        fireEvent.click(updateButton);
      });

      await waitFor(() => {
        const timeUpdateCall = global.fetch.mock.calls.find(
          call => call[0].includes('/time') && call[1]?.method === 'POST'
        );
        expect(timeUpdateCall).toBeDefined();
        const body = JSON.parse(timeUpdateCall[1].body);
        expect(body.time_remaining).toBe(45);
      }, { timeout: 10000 });
    });

    test('allows editing team circumstance', async () => {
      setupFetchMock({
        '/rooms/create': { ok: true, json: async () => ({}) },
        '/rooms/TEST123': { ok: true, json: async () => mockRoomData },
        '/circumstance': {
          ok: true,
          json: async () => ({ message: 'Circumstance updated successfully' })
        }
      });

      await act(async () => {
        renderWithRouter(<Lobby />, {
          state: {
            inviteCode: 'TEST123',
            isGamemaster: true,
            boardConfig: mockBoardConfig
          }
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      }, { timeout: 10000 });

      const editButtons = screen.getAllByText('Edit');
      
      await act(async () => {
        fireEvent.click(editButtons[0]);
      });

      const input = screen.getByPlaceholderText('Enter circumstance');
      expect(input).toHaveValue('Test circumstance');

      await act(async () => {
        fireEvent.change(input, { target: { value: 'Updated circumstance' } });
      });

      const saveButton = screen.getByText('Save');
      
      await act(async () => {
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        const updateCall = global.fetch.mock.calls.find(
          call => call[0].includes('circumstance') && call[1]?.method === 'PUT'
        );
        expect(updateCall).toBeDefined();
        const body = JSON.parse(updateCall[1].body);
        expect(body.circumstance).toBe('Updated circumstance');
      }, { timeout: 10000 });
    });

    test('cancels editing team circumstance', async () => {
      setupFetchMock({
        '/rooms/create': { ok: true, json: async () => ({}) },
        '/rooms/TEST123': { ok: true, json: async () => mockRoomData }
      });

      await act(async () => {
        renderWithRouter(<Lobby />, {
          state: {
            inviteCode: 'TEST123',
            isGamemaster: true,
            boardConfig: mockBoardConfig
          }
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      }, { timeout: 10000 });

      const editButtons = screen.getAllByText('Edit');
      
      await act(async () => {
        fireEvent.click(editButtons[0]);
      });

      const cancelButton = screen.getByText('Cancel');
      
      await act(async () => {
        fireEvent.click(cancelButton);
      });

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Enter circumstance')).not.toBeInTheDocument();
      }, { timeout: 10000 });
    });

    test('deletes team successfully', async () => {
      setupFetchMock({
        '/rooms/create': { ok: true, json: async () => ({}) },
        '/rooms/TEST123': { ok: true, json: async () => mockRoomData },
        '/teams/Team Alpha': {
          ok: true,
          json: async () => ({ message: 'Team deleted successfully' })
        }
      });

      await act(async () => {
        renderWithRouter(<Lobby />, {
          state: {
            inviteCode: 'TEST123',
            isGamemaster: true,
            boardConfig: mockBoardConfig
          }
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      }, { timeout: 10000 });

      const deleteButtons = screen.getAllByText('Delete');
      
      await act(async () => {
        fireEvent.click(deleteButtons[0]);
      });

      await waitFor(() => {
        const deleteCall = global.fetch.mock.calls.find(
          call => call[0].includes('teams/Team Alpha') && call[1]?.method === 'DELETE'
        );
        expect(deleteCall).toBeDefined();
      }, { timeout: 10000 });
    });

    test('starts game and navigates correctly', async () => {
      setupFetchMock({
        '/rooms/create': { ok: true, json: async () => ({}) },
        '/rooms/TEST123': { ok: true, json: async () => mockRoomData },
        '/start': {
          ok: true,
          json: async () => ({ message: 'Game started successfully' })
        }
      });

      await act(async () => {
        renderWithRouter(<Lobby />, {
          state: {
            inviteCode: 'TEST123',
            isGamemaster: true,
            boardConfig: mockBoardConfig
          }
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Start Game')).toBeInTheDocument();
      }, { timeout: 10000 });

      const startButton = screen.getByText('Start Game');
      
      await act(async () => {
        fireEvent.click(startButton);
      });

      await waitFor(() => {
        const startCall = global.fetch.mock.calls.find(
          call => call[0].includes('/start') && call[1]?.method === 'POST'
        );
        expect(startCall).toBeDefined();
      }, { timeout: 10000 });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          '/game/TEST123/Gamemaster',
          expect.objectContaining({
            state: expect.objectContaining({
              boardConfig: mockBoardConfig,
              isGamemaster: true,
              timeRemaining: 30
            })
          })
        );
      }, { timeout: 10000 });
    });

    test('shows no teams message when no teams exist', async () => {
      const emptyRoomData = { ...mockRoomData, teams: [] };
      
      setupFetchMock({
        '/rooms/create': { ok: true, json: async () => ({}) },
        '/rooms/TEST123': { ok: true, json: async () => emptyRoomData }
      });

      await act(async () => {
        renderWithRouter(<Lobby />, {
          state: {
            inviteCode: 'TEST123',
            isGamemaster: true,
            boardConfig: mockBoardConfig
          }
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Waiting for teams to join...')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    test('handles room creation error', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      setupFetchMock({
        '/rooms/create': {
          ok: false,
          status: 400,
          text: async () => JSON.stringify({ detail: 'Room already exists' })
        }
      });

      await act(async () => {
        renderWithRouter(<Lobby />, {
          state: {
            inviteCode: 'TEST123',
            isGamemaster: true,
            boardConfig: mockBoardConfig
          }
        });
      });

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to create room. Check console for details.');
      }, { timeout: 10000 });

      alertSpy.mockRestore();
    });
  });

  // ==================== PLAYER TESTS ====================

  describe('Player View', () => {
    test('shows waiting message when room does not exist', async () => {
      setupFetchMock({
        '/rooms/TEST123': {
          ok: false,
          status: 404,
          json: async () => ({ detail: 'Room not found' })
        }
      });

      await act(async () => {
        renderWithRouter(<Lobby />, {
          state: {
            inviteCode: 'TEST123',
            isGamemaster: false
          }
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/waiting for gamemaster to create the room/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    test('displays team join form when room exists', async () => {
      setupFetchMock({
        '/rooms/TEST123': { ok: true, json: async () => mockRoomData }
      });

      await act(async () => {
        renderWithRouter(<Lobby />, {
          state: {
            inviteCode: 'TEST123',
            isGamemaster: false
          }
        });
      });

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter team name')).toBeInTheDocument();
        expect(screen.getByText('Create Team')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    test('creates team successfully with valid name', async () => {
      setupFetchMock({
        '/rooms/TEST123': { ok: true, json: async () => mockRoomData },
        '/teams': {
          ok: true,
          json: async () => ({ message: 'Team added successfully' })
        }
      });

      await act(async () => {
        renderWithRouter(<Lobby />, {
          state: {
            inviteCode: 'TEST123',
            isGamemaster: false
          }
        });
      });

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter team name')).toBeInTheDocument();
      }, { timeout: 10000 });

      const teamInput = screen.getByPlaceholderText('Enter team name');
      
      await act(async () => {
        fireEvent.change(teamInput, { target: { value: 'Team Gamma' } });
      });

      const createButton = screen.getByText('Create Team');
      
      await act(async () => {
        fireEvent.click(createButton);
      });

      await waitFor(() => {
        const createCall = global.fetch.mock.calls.find(
          call => call[0].includes('/teams') && call[1]?.method === 'POST'
        );
        expect(createCall).toBeDefined();
      }, { timeout: 10000 });

      // Verify team data in request
      const createCall = global.fetch.mock.calls.find(
        call => call[0].includes('/teams') && call[1]?.method === 'POST'
      );
      const body = JSON.parse(createCall[1].body);
      expect(body.team_name).toBe('Team Gamma');
      expect(body.current_energy).toBe(32);
      expect(body.circumstance).toBe('');

      // Verify sessionStorage
      expect(sessionStorage.getItem('teamName')).toBe('Team Gamma');
    });

    test('shows waiting message after joining team', async () => {
      setupFetchMock({
        '/rooms/TEST123': { ok: true, json: async () => mockRoomData },
        '/teams': { ok: true, json: async () => ({}) }
      });

      await act(async () => {
        renderWithRouter(<Lobby />, {
          state: {
            inviteCode: 'TEST123',
            isGamemaster: false
          }
        });
      });

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter team name')).toBeInTheDocument();
      }, { timeout: 10000 });

      const teamInput = screen.getByPlaceholderText('Enter team name');
      
      await act(async () => {
        fireEvent.change(teamInput, { target: { value: 'Team Gamma' } });
      });

      const createButton = screen.getByText('Create Team');
      
      await act(async () => {
        fireEvent.click(createButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/waiting for gamemaster to start the game/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    test('shows alert when submitting empty team name', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      setupFetchMock({
        '/rooms/TEST123': { ok: true, json: async () => mockRoomData }
      });

      await act(async () => {
        renderWithRouter(<Lobby />, {
          state: {
            inviteCode: 'TEST123',
            isGamemaster: false
          }
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Create Team')).toBeInTheDocument();
      }, { timeout: 10000 });

      const createButton = screen.getByText('Create Team');
      
      await act(async () => {
        fireEvent.click(createButton);
      });

      expect(alertSpy).toHaveBeenCalledWith('Please enter a team name');
      alertSpy.mockRestore();
    });

    test('displays other teams in the lobby', async () => {
      setupFetchMock({
        '/rooms/TEST123': { ok: true, json: async () => mockRoomData }
      });

      await act(async () => {
        renderWithRouter(<Lobby />, {
          state: {
            inviteCode: 'TEST123',
            isGamemaster: false
          }
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Team Alpha')).toBeInTheDocument();
        expect(screen.getByText('Team Beta')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    test('redirects to game when game starts', async () => {
      const startedRoomData = { ...mockRoomData, game_started: true };
      
      sessionStorage.setItem('teamName', 'Team Gamma');
      
      setupFetchMock({
        '/rooms/TEST123': { ok: true, json: async () => startedRoomData }
      });

      await act(async () => {
        renderWithRouter(<Lobby />, {
          state: {
            inviteCode: 'TEST123',
            isGamemaster: false
          }
        });
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          '/game/TEST123/Team Gamma',
          expect.objectContaining({
            state: expect.objectContaining({
              boardConfig: mockBoardConfig,
              teamName: 'Team Gamma'
            })
          })
        );
      }, { timeout: 10000 });
    });

    test('handles team creation error', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      setupFetchMock({
        '/rooms/TEST123': { ok: true, json: async () => mockRoomData },
        '/teams': {
          ok: false,
          status: 400,
          text: async () => JSON.stringify({ detail: 'Team name already exists' })
        }
      });

      await act(async () => {
        renderWithRouter(<Lobby />, {
          state: {
            inviteCode: 'TEST123',
            isGamemaster: false
          }
        });
      });

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter team name')).toBeInTheDocument();
      }, { timeout: 10000 });

      const teamInput = screen.getByPlaceholderText('Enter team name');
      
      await act(async () => {
        fireEvent.change(teamInput, { target: { value: 'Team Alpha' } });
      });

      const createButton = screen.getByText('Create Team');
      
      await act(async () => {
        fireEvent.click(createButton);
      });

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to create team. Please try again.');
      }, { timeout: 10000 });

      alertSpy.mockRestore();
    });
  });

  // ==================== EDGE CASES & ERROR HANDLING ====================

  describe('Edge Cases and Error Handling', () => {
    test('handles missing boardConfig for gamemaster', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      setupFetchMock({
        '/rooms/TEST123': { ok: true, json: async () => mockRoomData }
      });

      await act(async () => {
        renderWithRouter(<Lobby />, {
          state: {
            inviteCode: 'TEST123',
            isGamemaster: true,
            boardConfig: null
          }
        });
      });

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('No board configuration found. Please create a board first.');
      }, { timeout: 10000 });

      alertSpy.mockRestore();
    });

    test('handles invalid boardConfig structure', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const invalidBoard = { name: 'Invalid Board' }; // Missing ringData
      
      setupFetchMock({
        '/rooms/TEST123': { ok: true, json: async () => mockRoomData }
      });

      await act(async () => {
        renderWithRouter(<Lobby />, {
          state: {
            inviteCode: 'TEST123',
            isGamemaster: true,
            boardConfig: invalidBoard
          }
        });
      });

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          expect.stringContaining("Invalid board configuration")
        );
      }, { timeout: 10000 });

      alertSpy.mockRestore();
    });

    test('handles time input with Enter key', async () => {
      setupFetchMock({
        '/rooms/create': { ok: true, json: async () => ({}) },
        '/rooms/TEST123': { ok: true, json: async () => mockRoomData },
        '/time': { ok: true, json: async () => ({}) }
      });

      await act(async () => {
        renderWithRouter(<Lobby />, {
          state: {
            inviteCode: 'TEST123',
            isGamemaster: true,
            boardConfig: mockBoardConfig
          }
        });
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('30')).toBeInTheDocument();
      }, { timeout: 10000 });

      const timeInput = screen.getByDisplayValue('30');
      
      await act(async () => {
        fireEvent.change(timeInput, { target: { value: '60' } });
        fireEvent.keyPress(timeInput, { key: 'Enter', code: 'Enter', charCode: 13 });
      });

      await waitFor(() => {
        const timeUpdateCall = global.fetch.mock.calls.find(
          call => call[0].includes('/time')
        );
        expect(timeUpdateCall).toBeDefined();
      }, { timeout: 10000 });
    });

    test('handles empty time input on blur', async () => {
      setupFetchMock({
        '/rooms/create': { ok: true, json: async () => ({}) },
        '/rooms/TEST123': { ok: true, json: async () => mockRoomData }
      });

      await act(async () => {
        renderWithRouter(<Lobby />, {
          state: {
            inviteCode: 'TEST123',
            isGamemaster: true,
            boardConfig: mockBoardConfig
          }
        });
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('30')).toBeInTheDocument();
      }, { timeout: 10000 });

      const timeInput = screen.getByDisplayValue('30');
      
      await act(async () => {
        fireEvent.change(timeInput, { target: { value: '' } });
        fireEvent.blur(timeInput);
      });

      await waitFor(() => {
        expect(timeInput.value).toBe('0');
      }, { timeout: 10000 });
    });

    test('displays teams with no circumstance correctly', async () => {
      const roomWithNoCircumstance = {
        ...mockRoomData,
        teams: [
          {
            id: 1,
            team_name: 'Team Epsilon',
            circumstance: '',
            current_energy: 32,
            gameboard_state: {}
          }
        ]
      };
      
      setupFetchMock({
        '/rooms/create': { ok: true, json: async () => ({}) },
        '/rooms/TEST123': { ok: true, json: async () => roomWithNoCircumstance }
      });

      await act(async () => {
        renderWithRouter(<Lobby />, {
          state: {
            inviteCode: 'TEST123',
            isGamemaster: true,
            boardConfig: mockBoardConfig
          }
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Team Epsilon')).toBeInTheDocument();
        expect(screen.getByText('No circumstance set')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    test('trims whitespace from room code', async () => {
      setupFetchMock({
        '/rooms/create': { ok: true, json: async () => ({}) },
        '/rooms/TEST123': { ok: true, json: async () => mockRoomData }
      });

      await act(async () => {
        renderWithRouter(<Lobby />, {
          state: {
            inviteCode: '  TEST123  ',
            isGamemaster: true,
            boardConfig: mockBoardConfig
          }
        });
      });

      await waitFor(() => {
        const createCall = global.fetch.mock.calls.find(
          call => call[0].includes('/rooms/create')
        );
        expect(createCall).toBeDefined();
      }, { timeout: 10000 });

      const createCall = global.fetch.mock.calls.find(
        call => call[0].includes('/rooms/create')
      );
      const body = JSON.parse(createCall[1].body);
      expect(body.room_code).toBe('TEST123');
      expect(body.room_code).not.toContain(' ');
    });

    test('handles network errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      global.fetch.mockRejectedValue(new Error('Network error'));

      await act(async () => {
        renderWithRouter(<Lobby />, {
          state: {
            inviteCode: 'TEST123',
            isGamemaster: false
          }
        });
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error loading room:',
          expect.any(Error)
        );
      }, { timeout: 10000 });

      consoleErrorSpy.mockRestore();
    });
  });

  // ==================== INTEGRATION SCENARIOS ====================

  describe('Integration Scenarios', () => {
    test('complete gamemaster flow: create room, wait for teams, start game', async () => {
      const roomWithTeams = { ...mockRoomData, teams: [] };
      const roomWithOneTeam = {
        ...mockRoomData,
        teams: [{
          id: 1,
          team_name: 'Test Team',
          circumstance: '',
          current_energy: 32,
          gameboard_state: {}
        }]
      };

      let pollCount = 0;
      global.fetch.mockImplementation((url, options) => {
        if (url.includes('/rooms/create')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ message: 'Room created' })
          });
        }
        if (url.includes('/start')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ message: 'Game started' })
          });
        }
        if (url.includes('/rooms/TEST123') && !options) {
          pollCount++;
          return Promise.resolve({
            ok: true,
            json: async () => pollCount < 3 ? roomWithTeams : roomWithOneTeam
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({})
        });
      });

      await act(async () => {
        renderWithRouter(<Lobby />, {
          state: {
            inviteCode: 'TEST123',
            isGamemaster: true,
            boardConfig: mockBoardConfig
          }
        });
      });

      // Wait for initial team list (empty)
      await waitFor(() => {
        expect(screen.getByText('Waiting for teams to join...')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Wait for a team to appear (simulating polling)
      await new Promise(resolve => setTimeout(resolve, 6000));

      await waitFor(() => {
        expect(screen.getByText('Test Team')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Start the game
      const startButton = screen.getByText('Start Game');
      await act(async () => {
        fireEvent.click(startButton);
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          '/game/TEST123/Gamemaster',
          expect.objectContaining({
            state: expect.objectContaining({
              isGamemaster: true
            })
          })
        );
      }, { timeout: 10000 });
    });

    test('complete player flow: wait for room, join team, wait for start', async () => {
      let gameStarted = false;
      
      global.fetch.mockImplementation((url, options) => {
        if (url.includes('/teams') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ message: 'Team added' })
          });
        }
        if (url.includes('/rooms/TEST123')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              ...mockRoomData,
              game_started: gameStarted
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({})
        });
      });

      sessionStorage.setItem('teamName', 'My Team');

      await act(async () => {
        renderWithRouter(<Lobby />, {
          state: {
            inviteCode: 'TEST123',
            isGamemaster: false
          }
        });
      });

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter team name')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Join team
      const teamInput = screen.getByPlaceholderText('Enter team name');
      await act(async () => {
        fireEvent.change(teamInput, { target: { value: 'My Team' } });
      });

      const createButton = screen.getByText('Create Team');
      await act(async () => {
        fireEvent.click(createButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/waiting for gamemaster to start the game/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Simulate game starting
      gameStarted = true;
      await new Promise(resolve => setTimeout(resolve, 2000));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          expect.stringContaining('/game/'),
          expect.objectContaining({
            state: expect.objectContaining({
              teamName: 'My Team'
            })
          })
        );
      }, { timeout: 10000 });
    });
  });
});
