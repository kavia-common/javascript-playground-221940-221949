import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Run / Preview button and HTML editor textarea', () => {
  render(<App />);
  const runButton = screen.getByRole('button', { name: /run/i });
  expect(runButton).toBeInTheDocument();

  const htmlEditor = screen.getByLabelText(/html editor/i);
  expect(htmlEditor.tagName.toLowerCase()).toBe('textarea');
});
