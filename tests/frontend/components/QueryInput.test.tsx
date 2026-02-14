// ============================================================
// Acuity Invest — QueryInput Component Tests
// Tests for query input validation, character counting, and submission
// ============================================================

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import React, { useState } from 'react';

// --------------- Component Mock ---------------

interface QueryInputProps {
  onSubmit: (query: string) => void;
  isLoading?: boolean;
  maxLength?: number;
  remainingQueries?: number;
}

function QueryInput({
  onSubmit,
  isLoading = false,
  maxLength = 500,
  remainingQueries,
}: QueryInputProps) {
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = query.trim();

    if (!trimmed) {
      setError('Please enter a question about your portfolio.');
      return;
    }

    if (trimmed.length > maxLength) {
      setError(`Query must be ${maxLength} characters or less.`);
      return;
    }

    if (remainingQueries !== undefined && remainingQueries <= 0) {
      setError('You have reached your daily query limit. Upgrade to PREMIUM for more.');
      return;
    }

    setError(null);
    onSubmit(trimmed);
  };

  const charCount = query.length;
  const isOverLimit = charCount > maxLength;

  return (
    <form data-testid="query-form" onSubmit={handleSubmit}>
      <div className="query-input-wrapper">
        <textarea
          data-testid="query-input"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setError(null);
          }}
          placeholder="Ask about your portfolio... (e.g., 'How is my portfolio performing?')"
          disabled={isLoading}
          rows={3}
          aria-label="Portfolio query"
        />

        <div data-testid="char-count" className={isOverLimit ? 'text-red' : ''}>
          {charCount}/{maxLength}
        </div>

        {remainingQueries !== undefined && (
          <div data-testid="remaining-queries">
            {remainingQueries} queries remaining today
          </div>
        )}

        {error && (
          <div data-testid="query-error" className="error-message" role="alert">
            {error}
          </div>
        )}

        <button
          data-testid="submit-button"
          type="submit"
          disabled={isLoading || isOverLimit}
        >
          {isLoading ? 'Analyzing...' : 'Get Insights'}
        </button>
      </div>
    </form>
  );
}

// --------------- Tests ---------------

describe('QueryInput', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Rendering ---

  describe('Rendering', () => {
    it('should render the query form', () => {
      render(<QueryInput onSubmit={mockOnSubmit} />);
      expect(screen.getByTestId('query-form')).toBeInTheDocument();
    });

    it('should render textarea with placeholder', () => {
      render(<QueryInput onSubmit={mockOnSubmit} />);
      const textarea = screen.getByTestId('query-input');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute('placeholder', expect.stringContaining('portfolio'));
    });

    it('should render submit button', () => {
      render(<QueryInput onSubmit={mockOnSubmit} />);
      expect(screen.getByTestId('submit-button')).toHaveTextContent('Get Insights');
    });

    it('should render character counter starting at 0/500', () => {
      render(<QueryInput onSubmit={mockOnSubmit} />);
      expect(screen.getByTestId('char-count')).toHaveTextContent('0/500');
    });

    it('should show remaining queries when provided', () => {
      render(<QueryInput onSubmit={mockOnSubmit} remainingQueries={3} />);
      expect(screen.getByTestId('remaining-queries')).toHaveTextContent('3 queries remaining');
    });
  });

  // --- Input Handling ---

  describe('Input Handling', () => {
    it('should update character count as user types', async () => {
      render(<QueryInput onSubmit={mockOnSubmit} />);
      const textarea = screen.getByTestId('query-input');

      fireEvent.change(textarea, { target: { value: 'Hello' } });

      expect(screen.getByTestId('char-count')).toHaveTextContent('5/500');
    });

    it('should show red character count when over limit', () => {
      render(<QueryInput onSubmit={mockOnSubmit} maxLength={10} />);
      const textarea = screen.getByTestId('query-input');

      fireEvent.change(textarea, { target: { value: 'This is too long' } });

      expect(screen.getByTestId('char-count').className).toContain('text-red');
    });

    it('should disable submit button when over character limit', () => {
      render(<QueryInput onSubmit={mockOnSubmit} maxLength={10} />);
      const textarea = screen.getByTestId('query-input');

      fireEvent.change(textarea, { target: { value: 'This is too long' } });

      expect(screen.getByTestId('submit-button')).toBeDisabled();
    });
  });

  // --- Submission ---

  describe('Submission', () => {
    it('should call onSubmit with trimmed query', () => {
      render(<QueryInput onSubmit={mockOnSubmit} />);
      const textarea = screen.getByTestId('query-input');

      fireEvent.change(textarea, { target: { value: '  How is my portfolio?  ' } });
      fireEvent.submit(screen.getByTestId('query-form'));

      expect(mockOnSubmit).toHaveBeenCalledWith('How is my portfolio?');
    });

    it('should show error for empty query submission', () => {
      render(<QueryInput onSubmit={mockOnSubmit} />);

      fireEvent.submit(screen.getByTestId('query-form'));

      expect(screen.getByTestId('query-error')).toHaveTextContent('Please enter a question');
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show error for whitespace-only query', () => {
      render(<QueryInput onSubmit={mockOnSubmit} />);
      const textarea = screen.getByTestId('query-input');

      fireEvent.change(textarea, { target: { value: '   ' } });
      fireEvent.submit(screen.getByTestId('query-form'));

      expect(screen.getByTestId('query-error')).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show error when query exceeds max length', () => {
      render(<QueryInput onSubmit={mockOnSubmit} maxLength={10} />);
      const textarea = screen.getByTestId('query-input');

      fireEvent.change(textarea, { target: { value: 'This query is definitely too long' } });
      fireEvent.submit(screen.getByTestId('query-form'));

      expect(screen.getByTestId('query-error')).toHaveTextContent('10 characters or less');
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show error when daily query limit is reached', () => {
      render(<QueryInput onSubmit={mockOnSubmit} remainingQueries={0} />);
      const textarea = screen.getByTestId('query-input');

      fireEvent.change(textarea, { target: { value: 'My query' } });
      fireEvent.submit(screen.getByTestId('query-form'));

      expect(screen.getByTestId('query-error')).toHaveTextContent('daily query limit');
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should clear error when user types after error', () => {
      render(<QueryInput onSubmit={mockOnSubmit} />);

      fireEvent.submit(screen.getByTestId('query-form'));
      expect(screen.getByTestId('query-error')).toBeInTheDocument();

      fireEvent.change(screen.getByTestId('query-input'), { target: { value: 'H' } });
      expect(screen.queryByTestId('query-error')).not.toBeInTheDocument();
    });
  });

  // --- Loading State ---

  describe('Loading State', () => {
    it('should disable textarea during loading', () => {
      render(<QueryInput onSubmit={mockOnSubmit} isLoading={true} />);
      expect(screen.getByTestId('query-input')).toBeDisabled();
    });

    it('should disable submit button during loading', () => {
      render(<QueryInput onSubmit={mockOnSubmit} isLoading={true} />);
      expect(screen.getByTestId('submit-button')).toBeDisabled();
    });

    it('should show "Analyzing..." text during loading', () => {
      render(<QueryInput onSubmit={mockOnSubmit} isLoading={true} />);
      expect(screen.getByTestId('submit-button')).toHaveTextContent('Analyzing...');
    });
  });

  // --- Accessibility ---

  describe('Accessibility', () => {
    it('should have aria-label on textarea', () => {
      render(<QueryInput onSubmit={mockOnSubmit} />);
      expect(screen.getByTestId('query-input')).toHaveAttribute('aria-label', 'Portfolio query');
    });

    it('should have role=alert on error messages', () => {
      render(<QueryInput onSubmit={mockOnSubmit} />);

      fireEvent.submit(screen.getByTestId('query-form'));

      expect(screen.getByTestId('query-error')).toHaveAttribute('role', 'alert');
    });
  });
});
