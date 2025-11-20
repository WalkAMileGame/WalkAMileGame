/* global global */
import userEvent from '@testing-library/user-event'
import { expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from 'react-router-dom';
import GameBoard from '../components/GameBoard'


vi.stubGlobal('fetch', vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ values: 100 }),
  })
));

beforeEach(() => {
  vi.spyOn(global, 'fetch').mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ values: 100 }),
    })
  );
});

// Helper function to render with Router
const renderWithRouter = (initialState = null) => {
  return render(
    <MemoryRouter initialEntries={[{ state: initialState }]}>
      <GameBoard />
    </MemoryRouter>
  );
};

test('renders gameboard', async () => {
    renderWithRouter();

    const linkElement = screen.getByText(/Start!/)

    expect(linkElement).toBeInTheDocument()
})

test('clicking a slice calls the update function and deducts a point', async () => {
  const user = userEvent.setup();
  const fetchSpy = vi.spyOn(global, 'fetch');
  renderWithRouter();

  await screen.findByText(/Remaining energypoints: 100/i);

  fetchSpy.mockImplementationOnce(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ values: 99 }),
    })
  );

  const firstSlice = screen.getByTestId('slice-1');
  await user.click(firstSlice);

  expect(fetchSpy).toHaveBeenCalledWith("http://localhost:8000/items", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ change: -1 }),
  });

  expect(await screen.findByText(/Remaining energypoints: 99/i)).toBeInTheDocument();
});

test('clicking a slice twice calls the update funciton and returns the deducted point', async () =>{
  const user = userEvent.setup();
  const fetchSpy = vi.spyOn(global, 'fetch');
  renderWithRouter();

  await screen.findByText(/Remaining energypoints: 100/i);

  fetchSpy.mockImplementationOnce(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ values: 99 }),
    })
  );

  const firstSlice = screen.getByTestId('slice-1');
  await user.click(firstSlice);

  expect(await screen.findByText(/Remaining energypoints: 99/i));

  await user.click(firstSlice);

  expect(fetchSpy).toHaveBeenCalledWith("http://localhost:8000/items", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ change: 1 }),
  });

  expect(await screen.findByText(/Remaining energypoints: 100/i));
})

test('splits long labeltexts into multiple lines', async () =>{
  const configWithLongText = {
  name: 'Default Gameboard',
      ringData: [
        {
          id: 1,
          innerRadius: 200,
          outerRadius: 350,
          labels: [
            { id: 1, text: "This is a very long string of text that must be split into several lines to fit properly", color: "#ffc072", energyvalue: 1 },
            { id: 2, text: "Action 2", color: "#ffb088", energyvalue: 1 },
            { id: 3, text: "Action 3", color: "#ffc072", energyvalue: 1 },
            { id: 4, text: "Action 4", color: "#ffb088", energyvalue: 1 },
            { id: 5, text: "Action 5", color: "#d79543", energyvalue: 1 },
            { id: 6, text: "Action 6", color: "#d79543", energyvalue: 1 },
            { id: 7, text: "Action 7", color: "#d79543", energyvalue: 1 },
            { id: 8, text: "Action 8", color: "#e17f4d", energyvalue: 1 },
            { id: 9, text: "Action 9", color: "#e17f4d", energyvalue: 1 },
            { id: 10, text: "Action 10", color: "#e17f4d", energyvalue: 1 }
          ]      
        },
        {
          id: 2,
          innerRadius: 350,
          outerRadius: 500,
                labels: [
            { id: 11, text: "Action 11", color: "#a3d7ff", energyvalue: 1 },
            { id: 12, text: "Action 12", color: "#a0b8ca", energyvalue: 1 },
            { id: 13, text: "Action 13", color: "#a0b8ca", energyvalue: 1 }
          ],
        },
        {
          id: 3,
          innerRadius: 500,
          outerRadius: 650,
          labels: [
            { id: 21, text: "Action 21", color: "#bb98d5", energyvalue: 1 },
            { id: 22, text: "Action 22", color: "#bb98d5", energyvalue: 1 }
          ]
        },
        {
          id: 4,
          innerRadius: 650,
          outerRadius: 800,
                labels: [
            { id: 31, text: "Action 31", color: "#da6363", energyvalue: 1 },
            { id: 32, text: "Action 32", color: "#da6363", energyvalue: 1 }
          ],   
        }
      ]
    }

    renderWithRouter({ boardConfig: configWithLongText });

    expect(screen.getByText("This is a very")).toBeInTheDocument();
    expect(screen.getByText("long string of")).toBeInTheDocument();
    expect(screen.getByText("text that must")).toBeInTheDocument();
    expect(screen.getByText("be split into")).toBeInTheDocument();
    expect(screen.getByText("several lines")).toBeInTheDocument();
    expect(screen.getByText("to fit")).toBeInTheDocument();
  })

test('should rotate a ring when dragged with the mouse', async () =>{
  const user = userEvent.setup();
  renderWithRouter();

  const ringToDrag = screen.getByTestId('ring-group-1');
  const sliceToGrab = screen.getByTestId('slice-1');

  const initialTransform = ringToDrag.getAttribute('transform');

  await user.pointer([
    { keys: '[MouseLeft>]', target: sliceToGrab }, 
    { coords: { x: 900, y: 800 } },
    { keys: '[/MouseLeft]' },
  ]);

  const finalTransform = ringToDrag.getAttribute('transform');

  expect(finalTransform).not.toBe(initialTransform);
  expect(finalTransform).toContain('rotate');
})

test('should pan the board when right-click dragging', async () => {
  renderWithRouter();
  await screen.findByText(/Remaining energypoints: 100/i);
  const wheelContainer = screen.getByTestId('ring-group-1').closest('.wheel-container');
  const initialTransform = wheelContainer.style.transform;
  expect(initialTransform).toContain('translate(0px, 0px)');

  fireEvent.mouseDown(wheelContainer, { 
    button: 2, 
    clientX: 500, 
    clientY: 500 
  });
  
  fireEvent.mouseMove(window, { 
    clientX: 650, 
    clientY: 700 
  });
  
  fireEvent.mouseUp(window);

  const finalTransform = wheelContainer.style.transform;
  expect(finalTransform).not.toBe(initialTransform);
  expect(finalTransform).toContain('translate(150px, 200px)');
});

test('should update pan position continuously while dragging', async () => {
  renderWithRouter();
  await screen.findByText(/Remaining energypoints: 100/i);
  const wheelContainer = screen.getByTestId('ring-group-1').closest('.wheel-container');

  fireEvent.mouseDown(wheelContainer, { 
    button: 2, 
    clientX: 400, 
    clientY: 400 
  });

  fireEvent.mouseMove(window, { 
    clientX: 450, 
    clientY: 450 
  });
  
  let currentTransform = wheelContainer.style.transform;
  expect(currentTransform).toContain('translate(50px, 50px)');

  // Second move (should continue from the start position, not accumulate)
  fireEvent.mouseMove(window, { 
    clientX: 500, 
    clientY: 550 
  });
  
  currentTransform = wheelContainer.style.transform;
  expect(currentTransform).toContain('translate(100px, 150px)');
  fireEvent.mouseUp(window);

  const finalTransform = wheelContainer.style.transform;
  expect(finalTransform).toContain('translate(100px, 150px)');
});

// Test ColorGuide component rendering
/* test('renders ColorGuide component with all elements', () => {
    renderWithRouter();

    // Check container exists
    const colorGuide = document.querySelector('.color-guide-container');
    expect(colorGuide).toBeInTheDocument();

    // Check all text labels are present
    expect(screen.getByText('MOVING')).toBeInTheDocument();
    expect(screen.getByText('ARRIVING')).toBeInTheDocument();
    expect(screen.getByText('THRIVING')).toBeInTheDocument();

    // Verify we have 3 rows
    const rows = document.querySelectorAll('.color-guide-row');
    expect(rows).toHaveLength(3);
  });*/