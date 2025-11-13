import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, test, beforeEach, afterEach, expect, vi } from 'vitest';
import Timer from '../../components/ui/Timer';

vi.mock('../../api', () => ({
  API_BASE: 'http://localhost:8000'
}));

describe('Timer', () => {
  let mockFetch;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllTimers();
  });

  const mockRoomData = (timeRemaining, gameStartedAt = null) => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        time_remaining: timeRemaining,
        game_started_at: gameStartedAt
      })
    });
  };

  test('shows loading state initially', () => {
    mockRoomData(30);
    render(<Timer gamecode="ABC123" />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('fetches and displays timer for game not started', async () => {
    mockRoomData(30); // 30 minutes
    render(<Timer gamecode="ABC123" />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/rooms/ABC123');
      expect(screen.getByText('30:00')).toBeInTheDocument();
    });
  });

  test('calculates remaining time when game has started', async () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    mockRoomData(30, tenMinutesAgo); // Started 10 min ago, 30 min total

    render(<Timer gamecode="ABC123" />);

    await waitFor(() => {
      expect(screen.getByText('20:00')).toBeInTheDocument();
    });
  });

  test('counts down every second', async () => {
    let fetchCount = 0;

    global.fetch.mockImplementation(() => {
      fetchCount++;
      // Simulate time passing by adjusting game_started_at
      const secondsElapsed = fetchCount - 1;
      const adjustedStartTime = new Date(Date.now() - secondsElapsed * 1000).toISOString();

      return Promise.resolve({
        ok: true,
        json: async () => ({
          time_remaining: 1,
          game_started_at: adjustedStartTime,
          game_paused: false,
          accumulated_pause_time: 0
        })
      });
    });

    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<Timer gamecode="ABC123" />);

    await waitFor(() => expect(screen.getByText('1:00')).toBeInTheDocument());

    act(() => vi.advanceTimersByTime(1000));
    await waitFor(() => expect(screen.getByText(/0:5[0-9]/)).toBeInTheDocument());

    act(() => vi.advanceTimersByTime(30000));
    await waitFor(() => expect(screen.getByText(/0:[0-2][0-9]/)).toBeInTheDocument());

    vi.useRealTimers();
  });

  test('stops at 0:00 and calls onEnd callback', async () => {
    const onEnd = vi.fn();
    let fetchCount = 0;

    global.fetch.mockImplementation(() => {
      fetchCount++;
      const secondsElapsed = (fetchCount - 1) * 1;
      const adjustedStartTime = new Date(Date.now() - secondsElapsed * 1000).toISOString();

      return Promise.resolve({
        ok: true,
        json: async () => ({
          time_remaining: 2,
          game_started_at: adjustedStartTime,
          game_paused: false,
          accumulated_pause_time: 0
        })
      });
    });

    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<Timer gamecode="ABC123" onEnd={onEnd} />);

    await waitFor(() => expect(screen.getByText('2:00')).toBeInTheDocument());

    // Advance to near the end
    act(() => vi.advanceTimersByTime(119000));
    await waitFor(() => expect(screen.getByText(/0:0[0-1]/)).toBeInTheDocument());

    // Advance to ensure timer reaches 0:00
    act(() => vi.advanceTimersByTime(2000));

    await waitFor(() => {
      expect(screen.getByText('0:00')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(onEnd).toHaveBeenCalled();
    });

    vi.useRealTimers();
  });

  test('formats time with leading zeros', async () => {
    mockRoomData(5.15); // 5 minutes 9 seconds
    render(<Timer gamecode="ABC123" />);

    await waitFor(() => {
      expect(screen.getByText('5:09')).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<Timer gamecode="ABC123" />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  test('does not fetch when gamecode is empty', () => {
    render(<Timer gamecode="" />);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('shows 0:00 when game time has expired', async () => {
    const fortyMinutesAgo = new Date(Date.now() - 40 * 60 * 1000).toISOString();
    mockRoomData(30, fortyMinutesAgo); // Started 40 min ago, 30 min total

    render(<Timer gamecode="ABC123" />);

    await waitFor(() => {
      expect(screen.getByText('0:00')).toBeInTheDocument();
    });
  });
});
