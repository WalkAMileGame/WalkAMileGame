import { render, screen } from '@testing-library/react'
import HomePage from '../components/HomePage'
import userEvent from '@testing-library/user-event'

test('renders content', () => {

    render(<HomePage />)

    expect(screen.getByText('WALK A MILE:')).toBeInTheDocument();
    expect(screen.getByText('THE INTERNATIONAL PATH TO FINNISH EDUCATION')).toBeInTheDocument();
    
})

test('opens instructions', async () => {
    const user = userEvent.setup();
    render(<HomePage />)

  const instructionbtn = screen.getByText('INSTRUCTIONS');
  expect(instructionbtn).toBeInTheDocument();

  await user.click(instructionbtn);
    // checks that the instructions text is in the homepage and the instructions pop up
  const instructionstwice = await screen.findAllByText('INSTRUCTIONS');
  expect(instructionstwice.length).toBeGreaterThan(1);
})