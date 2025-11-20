import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Circumstances from '../components/Circumstances';
import { vi } from 'vitest';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'test@example.com', role: 'admin' },
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

const mockNotes = [
  {name: 'circumstance 1',description: 'this is circumstance 1',},
  {name: 'circumstance 2', description: 'this is circumstance 2',},
];

beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve(mockNotes),
    })
  );

  vi.spyOn(window, "confirm").mockReturnValue(true);
});

test('renders content', async () => {
  render(
    <MemoryRouter>
      <Circumstances />
    </MemoryRouter>
  );

  expect(screen.getByText('EDIT CIRCUMSTANCES')).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText('circumstance 1')).toBeInTheDocument();
    expect(screen.getByText('this is circumstance 1')).toBeInTheDocument();
  });
});

test('adding new circumstance'), async () => {
  render(
    <MemoryRouter>
      <Circumstances />
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(screen.getByText('circumstance 1')).toBeInTheDocument();
  });
  
  const addBtn = screen.getByTitle("Add new circumstance");
  await userEvent.click(addBtn);

  expect(screen.getByText("Add new circumstance")).toBeInTheDocument();
};

test('editing circumstance'), async () => {
    const user = userEvent.setup();
    render(
        <MemoryRouter>
            <Circumstances />
        </MemoryRouter>
    );

    await waitFor(() => {
        expect(screen.getByText('circumstance 1')).toBeInTheDocument();
    })
    const editBtn = screen.getAllByTitle('Edit')
    await user.click(editBtn[0])
    expect(screen.getByText('Edit circumstance')).toBeInTheDocument();
    expect(screen.getByText('circumstance 1')).toBeInTheDocument();
    expect(screen.getByText('this is circumstance 1')).toBeInTheDocument();
}

test('delete circumstance'), async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn((url, options) => {
    if (options?.method === "DELETE") {
      return Promise.resolve({ ok: true });
    }
    return Promise.resolve({ json: () => Promise.resolve(mockNotes) });
  });

    render(
        <MemoryRouter>
            <Circumstances />
        </MemoryRouter>
    );
     await waitFor(() => {
        expect(screen.getByText('circumstance 1')).toBeInTheDocument();
    })
    const deleteBtn = screen.getAllByTitle('Delete')
    await user.click(deleteBtn[0])   
    await waitFor(() => {
    expect(screen.queryByText("circumstance 1")).not.toBeInTheDocument();
  });
}