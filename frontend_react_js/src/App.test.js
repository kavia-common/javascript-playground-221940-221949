import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Run button and editor textarea', () => {
  render(<App />);
  const runButton = screen.getByRole('button', { name: /run/i });
  expect(runButton).toBeInTheDocument();

  const editor = screen.getByLabelText(/code editor/i);
  expect(editor.tagName.toLowerCase()).toBe('textarea');
});
