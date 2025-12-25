import { render, screen } from '@testing-library/react'
import HomePage from '../components/HomePage'
import AboutUs from '../components/AboutUs'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

// Create stable mock function
const mockAuthFetch = vi.fn((...args) => global.fetch(...args));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'admin@test.com', role: 'admin' },
    authFetch: mockAuthFetch,
  }),
}));

test('renders content', () => {

    render(
        <MemoryRouter>
            <HomePage />
        </MemoryRouter>
    )

    expect(screen.getByText('WALK A MILE:')).toBeInTheDocument();
    expect(screen.getByText('THE INTERNATIONAL PATH TO FINNISH EDUCATION')).toBeInTheDocument();

})

test('opens instructions', async () => {
    const user = userEvent.setup();
    render(
        <MemoryRouter>
            <HomePage />
        </MemoryRouter>
    )

  const instructionbtn = screen.getByText('INSTRUCTIONS');
  expect(instructionbtn).toBeInTheDocument();

  await user.click(instructionbtn);
    // checks that the instructions text is in the homepage and the instructions pop up
  const instructionstwice = await screen.findAllByText('INSTRUCTIONS');
  expect(instructionstwice.length).toBeGreaterThan(1);
})

test('opens About Us page and displays correct content', async () => {
    const user = userEvent.setup();
    render(
        <MemoryRouter initialEntries={['/']}>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutUs />} />
            </Routes>
        </MemoryRouter>
    )

    const aboutUsLink = screen.getByText('ABOUT US');
    expect(aboutUsLink).toBeInTheDocument();

    await user.click(aboutUsLink);

    // Check that all three paragraphs start with the correct text
    expect(screen.getByText(/Walk A Mile was created/i)).toBeInTheDocument();
    expect(screen.getByText(/As advisors, we listened/i)).toBeInTheDocument();
    expect(screen.getByText(/Together, we set out to design/i)).toBeInTheDocument();
})

test('About Us page renders decoration elements', async () => {
    const user = userEvent.setup();
    render(
        <MemoryRouter initialEntries={['/']}>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutUs />} />
            </Routes>
        </MemoryRouter>
    )

    const aboutUsLink = screen.getByText('ABOUT US');
    await user.click(aboutUsLink);

    // Check that all decoration elements are rendered (4 total: 2 top, 2 bottom)
    const decorationElements = document.querySelectorAll('.decoration-element');
    expect(decorationElements).toHaveLength(4);

    // Verify specific decoration elements exist
    expect(document.querySelector('.element1-top')).toBeInTheDocument();
    expect(document.querySelector('.element2-top')).toBeInTheDocument();
    expect(document.querySelector('.element1-bottom')).toBeInTheDocument();
    expect(document.querySelector('.element2-bottom')).toBeInTheDocument();
})