import { render, screen, waitFor, within, fireEvent, getByText } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import LandingPage from '../components/LandingPage'
import { describe, expect, vi } from 'vitest';
import EditUsers from '../components/EditUsers';


vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'admin@test.com', role: 'admin' },
    login: vi.fn(),
    logout: vi.fn(),
	authFetch: vi.fn((...args) => global.fetch(...args)),
  }),
}));

const getShiftedDate = (months) => {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date;
};

const futureDate = getShiftedDate(12);
const pastDate = getShiftedDate(-24);
const closePastDate = getShiftedDate(-6)
const pastActivationDate = getShiftedDate(-12);

const mockResponse = {
  users: [
    { email: "admin@test.com", role: "admin" },
    { email: "gamemaster@test.com", role: "gamemaster" },
    { email: "new@test.com", role: "gamemaster" },
	{ email: "testadmin2@test.com", role: "admin" },
	{ email: "code1@test.com", role: "gamemaster" },
	{ email: "code2@test.com", role: "admin" }
  ],
  codes: [
	{
      code: "UNUSED_VALID_CODE",
      creationTime: new Date().toISOString(),
      expirationTime: futureDate.toISOString(),
      activationTime: null,
      isUsed: false,
      usedByUser: null
    },
    {
      code: "UNUSED_EXPIRED_CODE",
      creationTime: pastDate.toISOString(),
      expirationTime: closePastDate.toISOString(),
      activationTime: null,
      isUsed: false,
      usedByUser: null
    },
	{
      code: "VALID_ACTIVATED_CODE_1",
      creationTime: pastDate.toISOString(),
      expirationTime: futureDate.toISOString(),
      activationTime: pastActivationDate.toISOString(),
      isUsed: true,
      usedByUser: "gamemaster@test.com"
    },
	{
      code: "VALID_ACTIVATED_CODE_2",
      creationTime: pastDate.toISOString(),
      expirationTime: futureDate.toISOString(),
      activationTime: pastActivationDate.toISOString(),
      isUsed: true,
      usedByUser: "testadmin2@test.com"
    },
	{
      code: "EXPIRED_ACTIVATED_CODE_1",
      creationTime: pastDate.toISOString(),
      expirationTime: closePastDate.toISOString(),
      activationTime: pastActivationDate.toISOString(),
      isUsed: true,
      usedByUser: "code2@test.com"
    },
	{
      code: "EXPIRED_ACTIVATED_CODE_2",
      creationTime: pastDate.toISOString(),
      expirationTime: closePastDate.toISOString(),
      activationTime: pastActivationDate.toISOString(),
      isUsed: true,
      usedByUser: "code1@test.com"
    }
  ]
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

	test('renders content', async () => {

		render(
			<MemoryRouter>
				<EditUsers />
			</MemoryRouter>
		);

		expect(screen.getByText('Access codes')).toBeInTheDocument();

		const adminUser = await screen.findByText('code2@test.com');
		expect(adminUser).toBeInTheDocument();

		expect(screen.getByText('Access codes')).toBeInTheDocument();

		const existingCode = await screen.findByText('UNUSED_VALID_CODE');
		expect(existingCode).toBeInTheDocument();

		const missingCode1 = screen.queryByText('VALID_ACTIVATED_CODE_1');
		expect(missingCode1).not.toBeInTheDocument();

		const missingCode2 = screen.queryByText('EXPIRED_ACTIVATED_CODE_2');
		expect(missingCode2).not.toBeInTheDocument();
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

	test('remove user', async () => {
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
	});

	test('remove user cancel', async () => {
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
	});

	test('promote user', async () => {
		const user = userEvent.setup();
		const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

		render(
		<MemoryRouter>
			<EditUsers />
		</MemoryRouter>
		);

		const userEmail = await screen.findByText(/gamemaster@test.com/i);
		const row = userEmail.closest('tr');

		const promoteButton = within(row).getByTitle("Promote");
		
		await user.click(promoteButton);

		expect(confirmSpy).toHaveBeenCalledWith(
			'Promote gamemaster@test.com to admin?'
		);

		const admin = await screen.findByText((content) => content.includes('admin@test.com'))
		expect(admin).toBeInTheDocument();

		const emailElement = await screen.findByText((content) => content.includes('gamemaster@test.com'));

		const emailRow = emailElement.closest('tr');

		const adminRole = within(emailRow).getByText('admin');
		expect(adminRole).toBeInTheDocument();

		const expirationDate = within(emailRow).getByText('-')
		expect(expirationDate).toBeInTheDocument();
	});

	test('promote user cancel', async () => {
		const user = userEvent.setup();
		const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => false);

		render(
		<MemoryRouter>
			<EditUsers />
		</MemoryRouter>
		);

		const userEmail = await screen.findByText(/gamemaster@test.com/i);
		const row = userEmail.closest('tr');

		const promoteButton = within(row).getByTitle("Promote");
		
		await user.click(promoteButton);

		expect(confirmSpy).toHaveBeenCalledWith(
			'Promote gamemaster@test.com to admin?'
		);

		const admin = await screen.findByText((content) => content.includes('admin@test.com'))
		expect(admin).toBeInTheDocument();

		const emailElement = await screen.findByText((content) => content.includes('gamemaster@test.com'));

		const emailRow = emailElement.closest('tr');

		const adminRole = within(emailRow).getByText('gamemaster');
		expect(adminRole).toBeInTheDocument();

		const expectedDateString = futureDate.toLocaleDateString();

		const expirationCell = row.querySelectorAll('td')[3];
		expect(expirationCell).toHaveTextContent(expectedDateString);
	});

	test("promote user fails", async () => {
		const user = userEvent.setup();
		const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

		global.fetch = vi.fn((url) => {
			if (url.includes('load_user_data')) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockResponse)
				});
			}
			if (url.includes('accept_user')) {
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
		const removeButton = within(row).getByTitle("Promote");

		expect(removeButton).toBeInTheDocument();

		await user.click(removeButton);

		expect(confirmSpy).toHaveBeenCalledWith(
			expect.stringContaining('gamemaster@test.com')
		);

		const expectedDateString = futureDate.toLocaleDateString();

		const expirationCell = row.querySelectorAll('td')[3];
		expect(expirationCell).toHaveTextContent(expectedDateString);
	});

	test('demote user', async () => {
		const user = userEvent.setup();
		const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

		render(
		<MemoryRouter>
			<EditUsers />
		</MemoryRouter>
		);

		const userEmail = await screen.findByText(/testadmin2@test.com/i);
		const row = userEmail.closest('tr');

		const promoteButton = within(row).getByTitle("Demote");
		
		await user.click(promoteButton);

		expect(confirmSpy).toHaveBeenCalledWith(
			'Demote testadmin2@test.com to gamemaster?'
		);

		const admin = await screen.findByText((content) => content.includes('admin@test.com'))
		expect(admin).toBeInTheDocument();

		const emailElement = await screen.findByText((content) => content.includes('testadmin2@test.com'));

		const emailRow = emailElement.closest('tr');

		const adminRole = within(emailRow).getByText('gamemaster');
		expect(adminRole).toBeInTheDocument();

		const expectedDateString = futureDate.toLocaleDateString();

		const expirationCell = row.querySelectorAll('td')[3];
		expect(expirationCell).toHaveTextContent(expectedDateString);
	});

	test('demote user cancel', async () => {
		const user = userEvent.setup();
		const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => false);

		render(
		<MemoryRouter>
			<EditUsers />
		</MemoryRouter>
		);

		const userEmail = await screen.findByText(/testadmin2@test.com/i);
		const row = userEmail.closest('tr');

		const promoteButton = within(row).getByTitle("Demote");
		
		await user.click(promoteButton);

		expect(confirmSpy).toHaveBeenCalledWith(
			'Demote testadmin2@test.com to gamemaster?'
		);

		const admin = await screen.findByText((content) => content.includes('admin@test.com'))
		expect(admin).toBeInTheDocument();

		const emailElement = await screen.findByText((content) => content.includes('testadmin2@test.com'));
		const emailRow = emailElement.closest('tr');

		const adminRole = within(emailRow).getByText('admin');
		expect(adminRole).toBeInTheDocument();

		const expirationDate = within(emailRow).getByText('-')
		expect(expirationDate).toBeInTheDocument();
	});

	test("demote user fails", async () => {
		const user = userEvent.setup();
		const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

		global.fetch = vi.fn((url) => {
			if (url.includes('load_user_data')) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockResponse)
				});
			}
			if (url.includes('accept_user')) {
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

		const userEmail = await screen.findByText(/testadmin2@test.com/i);
		
		const row = userEmail.closest('tr');
		const removeButton = within(row).getByTitle("Demote");

		expect(removeButton).toBeInTheDocument();

		await user.click(removeButton);

		expect(confirmSpy).toHaveBeenCalledWith(
			expect.stringContaining('testadmin2@test.com')
		);

		const emailElement = await screen.findByText((content) => content.includes('testadmin2@test.com'));
		const emailRow = emailElement.closest('tr');

		const expirationDate = within(emailRow).getByText('-')
		expect(expirationDate).toBeInTheDocument();
	});

	test('generate new code', async () => {
		const user = userEvent.setup();

		const newCodeData = {
			...mockResponse,
			codes: [
				...mockResponse.codes, 
				{
					code: "NEW_GENERATED_CODE",
					creationTime: new Date().toISOString(),
					expirationTime: getShiftedDate(6).toISOString(),
					activationTime: null,
					isUsed: false,
					usedByUser: null
				}
			]
		};
		
		global.fetch = vi.fn()
			.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse)
			})
			.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ message: "Generated" })
			})
			.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(newCodeData)
			});

		render(
		<MemoryRouter>
			<EditUsers />
		</MemoryRouter>
		);

		await screen.findByText("admin@test.com");

		const generateCodeButton = await screen.findByText(/Generate new code/i);
		await user.click(generateCodeButton);

		expect(global.fetch).toHaveBeenCalledWith(
			expect.stringContaining('/generate_access_code'),
			expect.objectContaining({
				method: "POST",
				body: expect.stringContaining('"valid_for":6')
			})
		);

		const newCodeCell = await screen.findByText("NEW_GENERATED_CODE");
    	expect(newCodeCell).toBeInTheDocument();

		const codeElement = await screen.findByText((content) => content.includes('NEW_GENERATED_CODE'));

		const row = codeElement.closest('tr');

		const expectedDateString = getShiftedDate(6).toLocaleDateString();

		const expirationCell = row.querySelectorAll('td')[2];
		expect(expirationCell).toHaveTextContent(expectedDateString);
	});

	test('generate new code with custom validity time', async () => {
		const user = userEvent.setup();

		const newCodeData = {
			...mockResponse,
			codes: [
				...mockResponse.codes, 
				{
					code: "NEW_GENERATED_CODE",
					creationTime: new Date().toISOString(),
					expirationTime: getShiftedDate(4).toISOString(),
					activationTime: null,
					isUsed: false,
					usedByUser: null
				}
			]
		};
		
		global.fetch = vi.fn()
			.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse)
			})
			.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ message: "Generated" })
			})
			.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(newCodeData)
			});

		render(
		<MemoryRouter>
			<EditUsers />
		</MemoryRouter>
		);

		await screen.findByText("admin@test.com");

		const durationInput = screen.getByRole('spinbutton'); 
    
		fireEvent.change(durationInput, { target: { value: '4' } });
    	expect(durationInput).toHaveValue(4);

		const generateCodeButton = await screen.findByText(/Generate new code/i);
		await user.click(generateCodeButton);

		expect(global.fetch).toHaveBeenCalledWith(
			expect.stringContaining('/generate_access_code'),
			expect.objectContaining({
				method: "POST",
				body: expect.stringContaining('"valid_for":4')
			})
		);

		const newCodeCell = await screen.findByText("NEW_GENERATED_CODE");
    	expect(newCodeCell).toBeInTheDocument();
	});

	test('remove access code', async () => {
		const user = userEvent.setup();
		const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

		render(
		<MemoryRouter>
			<EditUsers />
		</MemoryRouter>
		);

		const accessCode = await screen.findByText(/UNUSED_VALID_CODE/i);
		const row = accessCode.closest('tr');

		const removeButton = within(row).getByTitle("Delete Code");
		
		await user.click(removeButton);

		expect(confirmSpy).toHaveBeenCalledWith(
			expect.stringContaining('UNUSED_VALID_CODE')
		);

		await waitFor(() => {
			expect(screen.queryByText(/UNUSED_VALID_CODE/i)).not.toBeInTheDocument();
		});
	});

	test('remove access code cancel', async () => {
		const user = userEvent.setup();
		const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => false);

		render(
		<MemoryRouter>
			<EditUsers />
		</MemoryRouter>
		);

		const accessCode = await screen.findByText(/UNUSED_VALID_CODE/i);
		const row = accessCode.closest('tr');

		const removeButton = within(row).getByTitle("Delete Code");
		
		await user.click(removeButton);

		expect(confirmSpy).toHaveBeenCalledWith(
			expect.stringContaining('UNUSED_VALID_CODE')
		);

		await waitFor(() => {
			expect(screen.queryByText(/UNUSED_VALID_CODE/i)).toBeInTheDocument();
		});
	});

	test("remove access code fails", async () => {
		const user = userEvent.setup();
		const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

		global.fetch = vi.fn((url) => {
			if (url.includes('load_user_data')) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockResponse)
				});
			}
			if (url.includes('remove_access_code')) {
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

		const accessCode = await screen.findByText(/UNUSED_VALID_CODE/i);
		
		const row = accessCode.closest('tr');
		const removeButton = within(row).getByTitle("Delete Code");

		expect(removeButton).toBeInTheDocument();

		await user.click(removeButton);

		expect(confirmSpy).toHaveBeenCalledWith(
			expect.stringContaining('UNUSED_VALID_CODE')
		);

		await waitFor(() => {
			expect(screen.queryByText(/UNUSED_VALID_CODE/i)).toBeInTheDocument();
		});
	});

	test("sort access codes by creation date", async () => {
		const user = userEvent.setup();

		render(
			<MemoryRouter>
				<EditUsers />
			</MemoryRouter>
		);

		await screen.findByText("admin@test.com");

		const headers = screen.getAllByText(/Created/i);
		const sortHeader = headers[1]; 

		await user.click(sortHeader);

		let codeElements = screen.getAllByText(/_CODE/);
		expect(codeElements[0]).toHaveTextContent("UNUSED_EXPIRED_CODE");
		expect(codeElements[1]).toHaveTextContent("UNUSED_VALID_CODE");

		await user.click(sortHeader);

		codeElements = screen.getAllByText(/_CODE/);
		expect(codeElements[0]).toHaveTextContent("UNUSED_VALID_CODE");
		expect(codeElements[1]).toHaveTextContent("UNUSED_EXPIRED_CODE");
	});

	test("sort access codes by expiration date", async () => {
		const user = userEvent.setup();

		render(
			<MemoryRouter>
				<EditUsers />
			</MemoryRouter>
		);

		await screen.findByText("admin@test.com");

		const headers = screen.getAllByText(/Expiration/i);
		const sortHeader = headers[1]; 

		await user.click(sortHeader);

		let codeElements = screen.getAllByText(/_CODE/);
		expect(codeElements[0]).toHaveTextContent("UNUSED_EXPIRED_CODE");
		expect(codeElements[1]).toHaveTextContent("UNUSED_VALID_CODE");

		await user.click(sortHeader);

		codeElements = screen.getAllByText(/_CODE/);
		expect(codeElements[0]).toHaveTextContent("UNUSED_VALID_CODE");
		expect(codeElements[1]).toHaveTextContent("UNUSED_EXPIRED_CODE");
	});
});
