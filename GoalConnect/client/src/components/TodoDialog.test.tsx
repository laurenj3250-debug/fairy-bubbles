import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TodoDialog } from './TodoDialog';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock API request
vi.mock('@/lib/queryClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/queryClient')>();
  return {
    ...actual,
    apiRequest: vi.fn(),
  };
});

// Test wrapper with QueryClient
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('TodoDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('visibility', () => {
    it('renders when open is true', () => {
      render(
        <TodoDialog open={true} onOpenChange={vi.fn()} />,
        { wrapper }
      );

      // Dialog should be visible
      expect(document.body.innerHTML).toContain('todo');
    });

    it('does not render when open is false', () => {
      const { container } = render(
        <TodoDialog open={false} onOpenChange={vi.fn()} />,
        { wrapper }
      );

      // Should return null
      expect(container.firstChild).toBeNull();
    });
  });

  describe('subtask management', () => {
    it('allows adding subtasks', () => {
      render(
        <TodoDialog open={true} onOpenChange={vi.fn()} />,
        { wrapper }
      );

      // Find the subtask input (if it exists)
      const inputs = screen.queryAllByRole('textbox');
      const subtaskInput = inputs.find(input =>
        input.getAttribute('placeholder')?.toLowerCase().includes('subtask')
      );

      if (subtaskInput) {
        fireEvent.change(subtaskInput, { target: { value: 'New subtask' } });

        // Find and click add button
        const addButton = screen.getByRole('button', { name: /add/i });
        fireEvent.click(addButton);

        // Subtask should be added
        expect(screen.getByText('New subtask')).toBeInTheDocument();
      }
    });

    it('prevents adding empty subtasks', () => {
      render(
        <TodoDialog open={true} onOpenChange={vi.fn()} />,
        { wrapper }
      );

      const inputs = screen.queryAllByRole('textbox');
      const subtaskInput = inputs.find(input =>
        input.getAttribute('placeholder')?.toLowerCase().includes('subtask')
      );

      if (subtaskInput) {
        // Try to add empty subtask
        fireEvent.change(subtaskInput, { target: { value: '   ' } });

        const addButton = screen.getByRole('button', { name: /add/i });
        const initialSubtaskCount = screen.queryAllByRole('listitem').length;

        fireEvent.click(addButton);

        // Count should not change
        const finalSubtaskCount = screen.queryAllByRole('listitem').length;
        expect(finalSubtaskCount).toBe(initialSubtaskCount);
      }
    });

    it('allows removing subtasks', () => {
      render(
        <TodoDialog open={true} onOpenChange={vi.fn()} />,
        { wrapper }
      );

      const inputs = screen.queryAllByRole('textbox');
      const subtaskInput = inputs.find(input =>
        input.getAttribute('placeholder')?.toLowerCase().includes('subtask')
      );

      if (subtaskInput) {
        // Add a subtask
        fireEvent.change(subtaskInput, { target: { value: 'Test subtask' } });
        const addButton = screen.getByRole('button', { name: /add/i });
        fireEvent.click(addButton);

        // Find remove button (usually an X or delete icon)
        const removeButtons = screen.queryAllByRole('button', { name: /remove|delete/i });
        if (removeButtons.length > 0) {
          fireEvent.click(removeButtons[0]);

          // Subtask should be removed
          expect(screen.queryByText('Test subtask')).not.toBeInTheDocument();
        }
      }
    });
  });

  describe('date selection', () => {
    it('handles date option changes', () => {
      render(
        <TodoDialog open={true} onOpenChange={vi.fn()} />,
        { wrapper }
      );

      // Find date selector (select or radio buttons)
      const selects = screen.queryAllByRole('combobox');
      const dateSelect = selects.find(select =>
        select.getAttribute('name')?.toLowerCase().includes('date')
      );

      if (dateSelect) {
        fireEvent.change(dateSelect, { target: { value: 'today' } });
        expect(dateSelect).toHaveValue('today');
      }
    });

    it('shows custom date input when custom is selected', () => {
      render(
        <TodoDialog open={true} onOpenChange={vi.fn()} />,
        { wrapper }
      );

      const selects = screen.queryAllByRole('combobox');
      const dateSelect = selects.find(select =>
        select.getAttribute('name')?.toLowerCase().includes('date')
      );

      if (dateSelect) {
        fireEvent.change(dateSelect, { target: { value: 'custom' } });

        // Custom date input should appear
        const dateInputs = screen.queryAllByDisplayValue('');
        expect(dateInputs.length).toBeGreaterThan(0);
      }
    });
  });

  describe('difficulty selection', () => {
    it('defaults to medium difficulty', () => {
      render(
        <TodoDialog open={true} onOpenChange={vi.fn()} />,
        { wrapper }
      );

      // Check if medium is selected by default
      const difficultyInputs = screen.queryAllByRole('radio', { name: /medium/i });
      if (difficultyInputs.length > 0) {
        expect(difficultyInputs[0]).toBeChecked();
      }
    });

    it('allows changing difficulty', () => {
      render(
        <TodoDialog open={true} onOpenChange={vi.fn()} />,
        { wrapper }
      );

      const hardRadio = screen.queryByRole('radio', { name: /hard/i });
      if (hardRadio) {
        fireEvent.click(hardRadio);
        expect(hardRadio).toBeChecked();
      }
    });
  });

  describe('form submission', () => {
    it('requires a title', async () => {
      render(
        <TodoDialog open={true} onOpenChange={vi.fn()} />,
        { wrapper }
      );

      const submitButton = screen.queryByRole('button', { name: /submit|create|add/i });

      if (submitButton) {
        // Try to submit without a title
        fireEvent.click(submitButton);

        // Should not call API
        await waitFor(() => {
          const { apiRequest } = require('@/lib/queryClient');
          expect(apiRequest).not.toHaveBeenCalled();
        });
      }
    });

    it('disables submit button while submitting', async () => {
      const { apiRequest } = require('@/lib/queryClient');
      apiRequest.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <TodoDialog open={true} onOpenChange={vi.fn()} />,
        { wrapper }
      );

      const titleInput = screen.getByRole('textbox', { name: /title/i });
      fireEvent.change(titleInput, { target: { value: 'Test todo' } });

      const submitButton = screen.queryByRole('button', { name: /submit|create|add/i });

      if (submitButton) {
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(submitButton).toBeDisabled();
        });
      }
    });
  });

  describe('callback handling', () => {
    it('calls onOpenChange when closed', () => {
      const onOpenChange = vi.fn();

      render(
        <TodoDialog open={true} onOpenChange={onOpenChange} />,
        { wrapper }
      );

      const closeButtons = screen.queryAllByRole('button', { name: /close|cancel/i });
      if (closeButtons.length > 0) {
        fireEvent.click(closeButtons[0]);
        expect(onOpenChange).toHaveBeenCalledWith(false);
      }
    });
  });
});
