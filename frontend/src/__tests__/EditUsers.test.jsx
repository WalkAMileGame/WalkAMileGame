import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import LandingPage from '../components/LandingPage'
import { describe, vi } from 'vitest';
import EditUsers from '../components/EditUsers';


vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'admin@test.com', role: 'admin' },
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

const mockResponse = {
  users: [
    { email: "admin@test.com", role: "admin" },
    { email: "gamemaster@test.com", role: "gamemaster" },
    { email: "new@test.com", role: "gamemaster" }
  ],
  codes: []
};

describe('EditUsers', () => {

	beforeEach(() => {
		global.fetch = vi.fn(() =>
		Promise.resolve({
			ok: true,
			json: () => Promise.resolve(mockResponse),
			})
		);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('renders content', () => {

	  render(
	  	<MemoryRouter>
	    	<EditUsers />
	  	</MemoryRouter>
	  );

	  expect(screen.getByText('Active users')).toBeInTheDocument();
	});

	test('loading users', async () => {
	  render(
			<MemoryRouter>
				<EditUsers />
			</MemoryRouter>
	  );

		const admin = await screen.findByText((content) => content.includes('admin@test.com'))
		expect(admin).toBeInTheDocument();

		const gamemaster = await screen.findByText((content) => content.includes('gamemaster@test.com'))
		expect(gamemaster).toBeInTheDocument();
	});

	test('removing user', async () => {
		const user = userEvent.setup();
		const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

		render(
		<MemoryRouter>
			<EditUsers />
		</MemoryRouter>
		);

		const userEmail = await screen.findByText(/gamemaster@test.com/i);
		const row = userEmail.closest('tr');

		const removeButton = within(row).getByTitle("Delete");
		
		await user.click(removeButton);

		expect(confirmSpy).toHaveBeenCalledWith(
			expect.stringContaining('gamemaster@test.com')
		);

		await waitFor(() => {
			expect(screen.queryByText(/gamemaster@test.com/i)).not.toBeInTheDocument();
		});

		confirmSpy.mockRestore();
	});

	test("remove user fails", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

    global.fetch = vi.fn((url) => {
        if (url.includes('load_user_data')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });
        }
        if (url.includes('remove_user')) {
            return Promise.resolve({
                ok: false,
                json: () => Promise.resolve({ error: "Server error" }),
            });
        }
        return Promise.reject(new Error(`Unknown URL: ${url}`));
    });

    render(
        <MemoryRouter>
            <EditUsers />
        </MemoryRouter>
    );

    const userEmail = await screen.findByText(/gamemaster@test.com/i);
    
    const row = userEmail.closest('tr');
    const removeButton = within(row).getByTitle("Delete");

    expect(removeButton).toBeInTheDocument();

    await user.click(removeButton);

    expect(confirmSpy).toHaveBeenCalledWith(
        expect.stringContaining('gamemaster@test.com')
    );

    const gamemaster = await screen.findByText(/gamemaster@test.com/i);
    expect(gamemaster).toBeInTheDocument();

    confirmSpy.mockRestore();
});

	test('cancel removing user', async () => {
    const user = userEvent.setup();
  	const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => false);

	render(
	<MemoryRouter>
		<EditUsers />
	</MemoryRouter>
	);

	const userEmail = await screen.findByText(/gamemaster@test.com/i);
	const row = userEmail.closest('tr');

	const removeButton = within(row).getByTitle("Delete");

	await user.click(removeButton);

	expect(confirmSpy).toHaveBeenCalledWith(
		'Are you sure you want to remove gamemaster@test.com?'
	);

	const admin = await screen.findByText((content) => content.includes('admin@test.com'))
	expect(admin).toBeInTheDocument();

	const gamemaster = await screen.findByText((content) => content.includes('gamemaster@test.com'))
	expect(gamemaster).toBeInTheDocument();

	confirmSpy.mockRestore();
	});

});