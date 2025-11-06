import { render, screen, waitFor } from '@testing-library/react';
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

const mockUsers = [
  {
    email: 'admin@test.com',
    role: 'admin',
    pending: false
  },
	{
	  email: 'gamemaster@test.com',
	  role: 'gamemaster',
	  pending: false
	},
	{
		email: 'new@test.com',
    role: 'gamemaster',
    pending: true
	}
];

describe('EditUsers', () => {

	beforeAll(() => {
		global.fetch = vi.fn(() => 
			Promise.resolve({
				ok: true,
				json: () => Promise.resolve(mockUsers),
			})
		);
	});

		afterAll(() => {
			global.fetch.mockRestore?.();
		});


	test('renders content', () => {

	  render(
	  	<MemoryRouter>
	    	<EditUsers />
	  	</MemoryRouter>
	  );

	  expect(screen.getByText('Existing users')).toBeInTheDocument();
	  expect(screen.getByText('Pending users')).toBeInTheDocument();
	});


	test('loading users', async () => {
	  render(
			<MemoryRouter>
				<EditUsers />
			</MemoryRouter>
	  );

		const admin = await screen.findByText('admin@test.com, admin');
		expect(admin.closest('.existing-users')).toBeInTheDocument();

		const gamemaster = await screen.findByText('gamemaster@test.com, gamemaster');
		expect(gamemaster.closest('.existing-users')).toBeInTheDocument();

		const pending = await screen.findByText('new@test.com');
		expect(pending.closest('.pending-users')).toBeInTheDocument();
	});


	test('accepting pending gamemaster', async () => {
    const user = userEvent.setup();

  	render(
  	  <MemoryRouter>
  	    <EditUsers />
  	  </MemoryRouter>
  	);
  	  const acceptButton = await screen.findByRole('button', { name: 'Accept' });

  	  expect(acceptButton).toBeInTheDocument();

  	  await user.click(acceptButton);
  	  expect(await screen.findByRole("radio", { name: "Admin" })).toBeInTheDocument();
    	expect(await screen.findByRole("radio", { name: "Gamemaster" })).toBeInTheDocument();

			const acceptButtons = await screen.findAllByRole('button', { name: 'Accept' });

  	  expect(acceptButtons[1]).toBeInTheDocument();

			await user.click(acceptButtons[1]);

			const admin = await screen.findByText('admin@test.com, admin');
			expect(admin.closest('.existing-users')).toBeInTheDocument();

			const gamemaster = await screen.findByText('gamemaster@test.com, gamemaster');
			expect(gamemaster.closest('.existing-users')).toBeInTheDocument();

			const added = await screen.findByText('new@test.com, gamemaster');
			expect(added.closest('.existing-users')).toBeInTheDocument();
	})


	test('accepting pending admin', async () => {
    const user = userEvent.setup();

  	render(
  	  <MemoryRouter>
  	    <EditUsers />
  	  </MemoryRouter>
  	);
  	  const acceptButton = await screen.findByRole('button', { name: 'Accept' });

  	  expect(acceptButton).toBeInTheDocument();

  	  await user.click(acceptButton);
  	  expect(await screen.findByRole("radio", { name: "Admin" })).toBeInTheDocument();
    	expect(await screen.findByRole("radio", { name: "Gamemaster" })).toBeInTheDocument();

			const radio = await screen.findByRole('radio', { name: 'Admin' });
			await user.click(radio)

			const acceptButtons = await screen.findAllByRole('button', { name: 'Accept' });

  	  expect(acceptButtons[1]).toBeInTheDocument();

			await user.click(acceptButtons[1]);

			const admin = await screen.findByText('admin@test.com, admin');
			expect(admin.closest('.existing-users')).toBeInTheDocument();

			const gamemaster = await screen.findByText('gamemaster@test.com, gamemaster');
			expect(gamemaster.closest('.existing-users')).toBeInTheDocument();

			const added = await screen.findByText('new@test.com, admin');
			expect(added.closest('.existing-users')).toBeInTheDocument();
	})


	test('denying user', async () => {
    const user = userEvent.setup();
		const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

  	render(
  	  <MemoryRouter>
  	    <EditUsers />
  	  </MemoryRouter>
  	);
  	  const denyButton = await screen.findByRole('button', { name: 'Deny' });

  	  expect(denyButton).toBeInTheDocument();

  	  await user.click(denyButton);

			expect(confirmSpy).toHaveBeenCalledWith(
    		'Are you sure you want to deny new@test.com?'
  		);

			const admin = await screen.findByText('admin@test.com, admin');
			expect(admin.closest('.existing-users')).toBeInTheDocument();

			const gamemaster = await screen.findByText('gamemaster@test.com, gamemaster');
			expect(gamemaster.closest('.existing-users')).toBeInTheDocument();

			await waitFor(() => {
    		expect(screen.queryByText('new@test.com')).not.toBeInTheDocument();
  		});

			confirmSpy.mockRestore();
	})


	test('removing user', async () => {
    const user = userEvent.setup();
		const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

  	render(
  	  <MemoryRouter>
  	    <EditUsers />
  	  </MemoryRouter>
  	);
  	  const removeButton = await screen.findByRole('button', { name: 'Remove' });

  	  expect(removeButton).toBeInTheDocument();

  	  await user.click(removeButton);

			expect(confirmSpy).toHaveBeenCalledWith(
    		'Are you sure you want to remove gamemaster@test.com?'
  		);

			const pending = await screen.findByText('new@test.com');
			expect(pending.closest('.pending-users')).toBeInTheDocument();

			const admin = await screen.findByText('admin@test.com, admin');
			expect(admin.closest('.existing-users')).toBeInTheDocument();

			await waitFor(() => {
    		expect(screen.queryByText('gamemaster@test.com, gamemaster')).not.toBeInTheDocument();
  		});

			confirmSpy.mockRestore();
	})

	test("accept user fails", async () => {
		const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

    global.fetch = vi.fn((url) => {
      if (url.includes('load_users')) {
        return Promise.resolve({ 
          ok: true, 
          json: () => Promise.resolve(mockUsers) 
        });
      }
      if (url.includes('accept_user')) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({}), 
        });
      }
    });

    render(
      <MemoryRouter>
  	    <EditUsers />
  	  </MemoryRouter>
    );

		const acceptButton = await screen.findByRole('button', { name: 'Accept' });

  	expect(acceptButton).toBeInTheDocument();

  	await user.click(acceptButton);

		const radio = await screen.findByRole('radio', { name: 'Admin' });
		await user.click(radio)

		const acceptButtons = await screen.findAllByRole('button', { name: 'Accept' });

  	expect(acceptButtons[1]).toBeInTheDocument();

		await user.click(acceptButtons[1]);

    const admin = await screen.findByText('admin@test.com, admin');
		expect(admin.closest('.existing-users')).toBeInTheDocument();

		const gamemaster = await screen.findByText('gamemaster@test.com, gamemaster');
		expect(gamemaster.closest('.existing-users')).toBeInTheDocument();

		const pending = await screen.findByText('new@test.com');
		expect(pending.closest('.pending-users')).toBeInTheDocument();

    confirmSpy.mockRestore();
  });

	test("deny user fails", async () => {
		const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

    global.fetch = vi.fn((url) => {
      if (url.includes('load_users')) {
        return Promise.resolve({ 
          ok: true, 
          json: () => Promise.resolve(mockUsers) 
        });
      }
      if (url.includes('remove_user')) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({}), 
        });
      }
    });

    render(
      <MemoryRouter>
  	    <EditUsers />
  	  </MemoryRouter>
    );

		const denyButton = await screen.findByRole('button', { name: 'Deny' });

  	expect(denyButton).toBeInTheDocument();

  	await user.click(denyButton);

		expect(confirmSpy).toHaveBeenCalledWith(
    		'Are you sure you want to deny new@test.com?'
  		);

    const admin = await screen.findByText('admin@test.com, admin');
		expect(admin.closest('.existing-users')).toBeInTheDocument();

		const gamemaster = await screen.findByText('gamemaster@test.com, gamemaster');
		expect(gamemaster.closest('.existing-users')).toBeInTheDocument();

		const pending = await screen.findByText('new@test.com');
		expect(pending.closest('.pending-users')).toBeInTheDocument();

    confirmSpy.mockRestore();
  });


	test("remove user fails", async () => {
		const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

    global.fetch = vi.fn((url) => {
      if (url.includes('load_users')) {
        return Promise.resolve({ 
          ok: true, 
          json: () => Promise.resolve(mockUsers) 
        });
      }
      if (url.includes('remove_user')) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({}), 
        });
      }
    });

    render(
      <MemoryRouter>
  	    <EditUsers />
  	  </MemoryRouter>
    );

		const removeButton = await screen.findByRole('button', { name: 'Remove' });

  	expect(removeButton).toBeInTheDocument();

  	await user.click(removeButton);

		expect(confirmSpy).toHaveBeenCalledWith(
    		'Are you sure you want to remove gamemaster@test.com?'
  		);

    const admin = await screen.findByText('admin@test.com, admin');
		expect(admin.closest('.existing-users')).toBeInTheDocument();

		const gamemaster = await screen.findByText('gamemaster@test.com, gamemaster');
		expect(gamemaster.closest('.existing-users')).toBeInTheDocument();

		const pending = await screen.findByText('new@test.com');
		expect(pending.closest('.pending-users')).toBeInTheDocument();

    confirmSpy.mockRestore();
  });


	test('cancel denying user', async () => {
    const user = userEvent.setup();
		const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => false);

  	render(
  	  <MemoryRouter>
  	    <EditUsers />
  	  </MemoryRouter>
  	);
  	  const denyButton = await screen.findByRole('button', { name: 'Deny' });

  	  expect(denyButton).toBeInTheDocument();

  	  await user.click(denyButton);

			expect(confirmSpy).toHaveBeenCalledWith(
    		'Are you sure you want to deny new@test.com?'
  		);

			const admin = await screen.findByText('admin@test.com, admin');
			expect(admin.closest('.existing-users')).toBeInTheDocument();

			const gamemaster = await screen.findByText('gamemaster@test.com, gamemaster');
			expect(gamemaster.closest('.existing-users')).toBeInTheDocument();

			const pending = await screen.findByText('new@test.com');
			expect(pending.closest('.pending-users')).toBeInTheDocument();

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
  	  const removeButton = await screen.findByRole('button', { name: 'Remove' });

  	  expect(removeButton).toBeInTheDocument();

  	  await user.click(removeButton);

			expect(confirmSpy).toHaveBeenCalledWith(
    		'Are you sure you want to remove gamemaster@test.com?'
  		);

			const admin = await screen.findByText('admin@test.com, admin');
			expect(admin.closest('.existing-users')).toBeInTheDocument();

			const gamemaster = await screen.findByText('gamemaster@test.com, gamemaster');
			expect(gamemaster.closest('.existing-users')).toBeInTheDocument();

			const pending = await screen.findByText('new@test.com');
			expect(pending.closest('.pending-users')).toBeInTheDocument();

			confirmSpy.mockRestore();
	});

});