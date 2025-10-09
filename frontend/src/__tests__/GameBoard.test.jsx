import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

test('renders gameboard', async () => {
    render(<GameBoard />)

    const linkElement = screen.getByText(/Start!/)

    expect(linkElement).toBeInTheDocument()
})

test('clicking a slice calls the update function and deducts a point', async () => {
  const user = userEvent.setup();
  const fetchSpy = vi.spyOn(global, 'fetch');
  render(<GameBoard />);

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
  render(<GameBoard />);

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
            { id: 1, text: "This is a very long string of text that must be split into several lines to fit properly", color: "#ffc072" },
            { id: 2, text: "Action 2", color: "#ffb088" },
            { id: 3, text: "Action 3", color: "#ffc072" },
            { id: 4, text: "Action 4", color: "#ffb088" },
            { id: 5, text: "Action 5", color: "#d79543" },
            { id: 6, text: "Action 6", color: "#d79543" },
            { id: 7, text: "Action 7", color: "#d79543" },
            { id: 8, text: "Action 8", color: "#e17f4d" },
            { id: 9, text: "Action 9", color: "#e17f4d" },
            { id: 10, text: "Action 10", color: "#e17f4d" }
          ]      
        },
        {
          id: 2,
          innerRadius: 350,
          outerRadius: 500,
                labels: [
            { id: 11, text: "Action 11", color: "#a3d7ff" },
            { id: 12, text: "Action 12", color: "#a0b8ca" },
            { id: 13, text: "Action 13", color: "#a0b8ca" }
          ],
        },
        {
          id: 3,
          innerRadius: 500,
          outerRadius: 650,
          labels: [
            { id: 21, text: "Action 21", color: "#bb98d5" },
            { id: 22, text: "Action 22", color: "#bb98d5" }
          ]
        },
        {
          id: 4,
          innerRadius: 650,
          outerRadius: 800,
                labels: [
            { id: 31, text: "Action 31", color: "#da6363" },
            { id: 32, text: "Action 32", color: "#da6363" }
          ],   
        }
      ]
    }

    render(<GameBoard initialconfig={configWithLongText} />);

    expect(screen.getByText("This is a very")).toBeInTheDocument();
    expect(screen.getByText("long string of")).toBeInTheDocument();
    expect(screen.getByText("text that must")).toBeInTheDocument();
    expect(screen.getByText("be split into")).toBeInTheDocument();
    expect(screen.getByText("several lines")).toBeInTheDocument();
    expect(screen.getByText("to fit")).toBeInTheDocument();
  })

test('should rotate a ring when dragged with the mouse', async () =>{
  const user = userEvent.setup();
  render(<GameBoard />);

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
