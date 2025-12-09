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
    authFetch: vi.fn((...args) => global.fetch(...args)),
  }),
}));

const mockNotes = [
  {_id: '1', title: 'circumstance 1', description: 'this is circumstance 1', author: 'test@example.com'},
  {_id: '2', title: 'circumstance 2', description: 'this is circumstance 2', author: 'test@example.com'},
];

beforeEach(() => {
  vi.spyOn(window, 'confirm').mockReturnValue(true);

  // Mock all fetch calls
  global.fetch = vi.fn((url, options) => {
    if (options?.method === 'DELETE') {
      return Promise.resolve({ ok: true });
    }
    if (options?.method === 'PUT') {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            _id: '1',
            title: 'Updated Title',
            description: 'Updated Description',
          }),
      });
    }
    if (options?.method === 'POST') {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            _id: '3',
            title: 'New Circumstance',
            description: 'New Description',
          }),
      });
    }
    return Promise.resolve({
      json: () =>
        Promise.resolve(mockNotes),
    });
  });
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

test('editing circumstance', async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter>
      <Circumstances />
    </MemoryRouter>
  );

  await waitFor(() => expect(screen.getByText('circumstance 1')).toBeInTheDocument());

  const editBtn = screen.getAllByTitle('Edit')[0];
  await user.click(editBtn);

  const titleInput = screen.getByLabelText('Title');
  const descriptionInput = screen.getByLabelText('Description');

  await user.clear(titleInput);
  await user.type(titleInput, 'Updated Title');

  await user.clear(descriptionInput);
  await user.type(descriptionInput, 'Updated Description');

  global.fetch = vi.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ _id: '1', id: '', title: 'Updated Title', description: 'Updated Description' }),
    })
  );

  const saveButton = screen.getByText('Save');
  await user.click(saveButton);

  await waitFor(() => {
    expect(screen.getByText('Updated Title')).toBeInTheDocument();
    expect(screen.getByText('Updated Description')).toBeInTheDocument();
  });

  expect(global.fetch).toHaveBeenCalledWith('/save_circumstance/1', expect.anything());
});


test('delete circumstance', async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter>
      <Circumstances />
    </MemoryRouter>
  );

  await waitFor(() => screen.getByText('circumstance 1'));

  const deleteBtn = screen.getAllByTitle('Delete')[0];
  await user.click(deleteBtn);

  await waitFor(() => {
    expect(screen.queryByText('circumstance 1')).not.toBeInTheDocument();
  });

  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining('1'),
    expect.objectContaining({ method: 'DELETE' })
  );
});


test('adding a new circumstance saves correctly', async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter>
      <Circumstances />
    </MemoryRouter>
  );

  await waitFor(() => screen.getByText('circumstance 1'));

  await user.click(screen.getByTitle('Add new circumstance'));

    const titleInput = screen.getByLabelText('Title');
    const descriptionInput = screen.getByLabelText('Description');

    await user.type(titleInput, 'new circumstance')
    await user.type(descriptionInput, 'here is new description for new circumstance')

  global.fetch = vi.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ _id: '3', title: 'new circumstance', description: 'here is new description for new circumstance' })
    })
  );

  await user.click(screen.getByText('Save'));

  expect(screen.getByText('new circumstance')).toBeInTheDocument();
  expect(screen.getByText('here is new description for new circumstance')).toBeInTheDocument();
});

