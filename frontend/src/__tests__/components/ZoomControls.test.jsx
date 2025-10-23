import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from '@testing-library/user-event';
import ZoomControls from '../../components/ZoomControls';

describe('ZoomControls', () => {
  const defaultProps = {
    zoom: 1,
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onReset: vi.fn(),
  };

  test('renders without crashing', () => {
    const { container } = render(<ZoomControls {...defaultProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  test('renders all three buttons', () => {
    render(<ZoomControls {...defaultProps} />);
    
    expect(screen.getByLabelText('Reset view')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
  });

  test('calls onReset when reset button is clicked', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    
    render(<ZoomControls {...defaultProps} onReset={onReset} />);
    
    const resetButton = screen.getByLabelText('Reset view');
    await user.click(resetButton);
    
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  test('calls onZoomIn when zoom in button is clicked', async () => {
    const user = userEvent.setup();
    const onZoomIn = vi.fn();
    
    render(<ZoomControls {...defaultProps} onZoomIn={onZoomIn} />);
    
    const zoomInButton = screen.getByLabelText('Zoom in');
    await user.click(zoomInButton);
    
    expect(onZoomIn).toHaveBeenCalledTimes(1);
  });

  test('calls onZoomOut when zoom out button is clicked', async () => {
    const user = userEvent.setup();
    const onZoomOut = vi.fn();
    
    render(<ZoomControls {...defaultProps} onZoomOut={onZoomOut} />);
    
    const zoomOutButton = screen.getByLabelText('Zoom out');
    await user.click(zoomOutButton);
    
    expect(onZoomOut).toHaveBeenCalledTimes(1);
  });

  test('disables zoom in button when at maximum zoom', () => {
    render(<ZoomControls {...defaultProps} zoom={2} maxZoom={2} />);
    
    const zoomInButton = screen.getByLabelText('Zoom in');
    expect(zoomInButton).toBeDisabled();
  });

  test('disables zoom out button when at minimum zoom', () => {
    render(<ZoomControls {...defaultProps} zoom={0.5} minZoom={0.5} />);
    
    const zoomOutButton = screen.getByLabelText('Zoom out');
    expect(zoomOutButton).toBeDisabled();
  });

  test('enables zoom in button when below maximum zoom', () => {
    render(<ZoomControls {...defaultProps} zoom={1.5} maxZoom={2} />);
    
    const zoomInButton = screen.getByLabelText('Zoom in');
    expect(zoomInButton).not.toBeDisabled();
  });

  test('enables zoom out button when above minimum zoom', () => {
    render(<ZoomControls {...defaultProps} zoom={1} minZoom={0.5} />);
    
    const zoomOutButton = screen.getByLabelText('Zoom out');
    expect(zoomOutButton).not.toBeDisabled();
  });

  test('reset button is always enabled regardless of zoom level', () => {
    const { rerender } = render(<ZoomControls {...defaultProps} zoom={0.5} minZoom={0.5} />);
    expect(screen.getByLabelText('Reset view')).not.toBeDisabled();
    
    rerender(<ZoomControls {...defaultProps} zoom={2} maxZoom={2} />);
    expect(screen.getByLabelText('Reset view')).not.toBeDisabled();
    
    rerender(<ZoomControls {...defaultProps} zoom={1} />);
    expect(screen.getByLabelText('Reset view')).not.toBeDisabled();
  });

  test('uses custom min and max zoom values', () => {
    render(<ZoomControls {...defaultProps} zoom={0.8} minZoom={0.8} maxZoom={3} />);
    
    const zoomOutButton = screen.getByLabelText('Zoom out');
    const zoomInButton = screen.getByLabelText('Zoom in');
    
    expect(zoomOutButton).toBeDisabled();
    expect(zoomInButton).not.toBeDisabled();
  });
});
