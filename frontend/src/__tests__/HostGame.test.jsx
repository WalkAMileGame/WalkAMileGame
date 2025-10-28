/* global global */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import HostGamePage from '../components/HostGame';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...await vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock fetch
global.fetch = vi.fn();

describe('HostGamePage - Core Functionality', () => {
  const mockBoards = [
    { name: 'Classic Board' },
    { name: 'Advanced Board' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    window.alert = vi.fn();
    fetch.mockResolvedValue({
      json: async () => mockBoards,
    });
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <HostGamePage />
      </BrowserRouter>
    );
  };

  test('loads gameboards from API on mount', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/load_all');
      expect(screen.getByText('Classic Board')).toBeInTheDocument();
      expect(screen.getByText('Advanced Board')).toBeInTheDocument();
    });
  });

  test('allows selecting a board', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Classic Board')).toBeInTheDocument();
    });
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'Classic Board' } });
    
    expect(select.value).toBe('Classic Board');
  });

  test('generates a valid 6-character invite code', () => {
    renderComponent();
    
    const generateButton = screen.getByText('Generate Random Code');
    fireEvent.click(generateButton);
    
    const input = screen.getByPlaceholderText('Enter or generate code');
    expect(input.value).toHaveLength(6);
    expect(input.value).toMatch(/^[A-Z0-9]{6}$/);
  });

  test('prevents starting game without board or code', async () => {
    renderComponent();
    
    const startButton = screen.getByText('Start Game');
    
    // Try without anything
    fireEvent.click(startButton);
    expect(window.alert).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    
    window.alert.mockClear();
    
    // Try with only code
    const generateButton = screen.getByText('Generate Random Code');
    fireEvent.click(generateButton);
    fireEvent.click(startButton);
    expect(window.alert).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('navigates to gameboard with correct data when starting game', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Classic Board')).toBeInTheDocument();
    });
    
    // Select board
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'Classic Board' } });
    
    // Generate code
    const generateButton = screen.getByText('Generate Random Code');
    fireEvent.click(generateButton);
    
    const input = screen.getByPlaceholderText('Enter or generate code');
    const generatedCode = input.value;
    
    // Start game
    const startButton = screen.getByText('Start Game');
    fireEvent.click(startButton);
    
    expect(mockNavigate).toHaveBeenCalledWith(`/game/${generatedCode}`, {
      state: {
        boardConfig: mockBoards[0],
        inviteCode: generatedCode,
      },
    });
  });
});
