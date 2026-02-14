// ============================================================
// Acuity Invest — useInsights Hook Tests
// Tests for insight query/response state management
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useState, useCallback } from 'react';

// --------------- Mock API ---------------

const mockGenerateInsight = vi.fn();

// --------------- Mock Data ---------------

const mockInsightResponse = {
  id: 'insight-001',
  query: 'How is my portfolio performing?',
  response: 'Your portfolio is up 27%.',
  tier: 'FREE' as const,
  created_at: '2025-02-14T10:00:00Z',
  scratchpad: 'Analyzing portfolio...',
  insights: '## Performance\nPortfolio is up 27%.',
  rejected: false,
};

const mockRejectedResponse = {
  id: 'insight-002',
  query: 'Should I sell AAPL?',
  response: '',
  tier: 'FREE' as const,
  created_at: '2025-02-14T10:05:00Z',
  scratchpad: 'Financial advice detected.',
  insights: 'I am unable to provide financial advice.',
  rejected: true,
};

// --------------- Hook Implementation ---------------

interface InsightResult {
  id: string;
  query: string;
  insights: string;
  scratchpad: string;
  rejected: boolean;
  tier: 'FREE' | 'PREMIUM';
  created_at: string;
}

function useInsights(token: string) {
  const [currentInsight, setCurrentInsight] = useState<InsightResult | null>(null);
  const [history, setHistory] = useState<InsightResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitQuery = useCallback(async (portfolioId: string, query: string) => {
    if (!query.trim()) {
      setError('Query cannot be empty');
      return null;
    }

    if (query.length > 500) {
      setError('Query exceeds 500 character limit');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await mockGenerateInsight(portfolioId, query, token);
      setCurrentInsight(result);
      setHistory((prev) => [result, ...prev]);
      return result;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const clearInsight = useCallback(() => {
    setCurrentInsight(null);
    setError(null);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    currentInsight,
    history,
    isLoading,
    error,
    submitQuery,
    clearInsight,
    clearHistory,
  };
}

// --------------- Tests ---------------

describe('useInsights', () => {
  const mockToken = 'Bearer test-token';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Initial State ---

  describe('Initial State', () => {
    it('should start with no current insight', () => {
      const { result } = renderHook(() => useInsights(mockToken));
      expect(result.current.currentInsight).toBeNull();
    });

    it('should start with empty history', () => {
      const { result } = renderHook(() => useInsights(mockToken));
      expect(result.current.history).toHaveLength(0);
    });

    it('should not be loading initially', () => {
      const { result } = renderHook(() => useInsights(mockToken));
      expect(result.current.isLoading).toBe(false);
    });

    it('should have no error initially', () => {
      const { result } = renderHook(() => useInsights(mockToken));
      expect(result.current.error).toBeNull();
    });
  });

  // --- Query Submission ---

  describe('submitQuery', () => {
    it('should submit query and store result', async () => {
      mockGenerateInsight.mockResolvedValue(mockInsightResponse);

      const { result } = renderHook(() => useInsights(mockToken));

      await act(async () => {
        await result.current.submitQuery('p1', 'How is my portfolio performing?');
      });

      expect(result.current.currentInsight).toEqual(mockInsightResponse);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set loading state during query', async () => {
      let resolvePromise: (value: any) => void;
      mockGenerateInsight.mockImplementation(
        () => new Promise((resolve) => { resolvePromise = resolve; })
      );

      const { result } = renderHook(() => useInsights(mockToken));

      act(() => {
        result.current.submitQuery('p1', 'Test query');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!(mockInsightResponse);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should pass correct parameters to API', async () => {
      mockGenerateInsight.mockResolvedValue(mockInsightResponse);

      const { result } = renderHook(() => useInsights(mockToken));

      await act(async () => {
        await result.current.submitQuery('p1', 'Analyze my holdings');
      });

      expect(mockGenerateInsight).toHaveBeenCalledWith('p1', 'Analyze my holdings', mockToken);
    });

    it('should add result to history (newest first)', async () => {
      const response1 = { ...mockInsightResponse, id: 'i1', query: 'Query 1' };
      const response2 = { ...mockInsightResponse, id: 'i2', query: 'Query 2' };

      mockGenerateInsight
        .mockResolvedValueOnce(response1)
        .mockResolvedValueOnce(response2);

      const { result } = renderHook(() => useInsights(mockToken));

      await act(async () => {
        await result.current.submitQuery('p1', 'Query 1');
      });

      await act(async () => {
        await result.current.submitQuery('p1', 'Query 2');
      });

      expect(result.current.history).toHaveLength(2);
      expect(result.current.history[0].query).toBe('Query 2'); // Newest first
      expect(result.current.history[1].query).toBe('Query 1');
    });

    it('should return the result from submitQuery', async () => {
      mockGenerateInsight.mockResolvedValue(mockInsightResponse);

      const { result } = renderHook(() => useInsights(mockToken));

      let queryResult: any;
      await act(async () => {
        queryResult = await result.current.submitQuery('p1', 'Test');
      });

      expect(queryResult).toEqual(mockInsightResponse);
    });
  });

  // --- Validation ---

  describe('Input Validation', () => {
    it('should reject empty query', async () => {
      const { result } = renderHook(() => useInsights(mockToken));

      await act(async () => {
        await result.current.submitQuery('p1', '');
      });

      expect(result.current.error).toBe('Query cannot be empty');
      expect(mockGenerateInsight).not.toHaveBeenCalled();
    });

    it('should reject whitespace-only query', async () => {
      const { result } = renderHook(() => useInsights(mockToken));

      await act(async () => {
        await result.current.submitQuery('p1', '   ');
      });

      expect(result.current.error).toBe('Query cannot be empty');
    });

    it('should reject query exceeding 500 characters', async () => {
      const { result } = renderHook(() => useInsights(mockToken));

      await act(async () => {
        await result.current.submitQuery('p1', 'x'.repeat(501));
      });

      expect(result.current.error).toBe('Query exceeds 500 character limit');
      expect(mockGenerateInsight).not.toHaveBeenCalled();
    });

    it('should return null for invalid queries', async () => {
      const { result } = renderHook(() => useInsights(mockToken));

      let queryResult: any;
      await act(async () => {
        queryResult = await result.current.submitQuery('p1', '');
      });

      expect(queryResult).toBeNull();
    });
  });

  // --- Financial Advice Rejection ---

  describe('Financial Advice Handling', () => {
    it('should store rejected responses correctly', async () => {
      mockGenerateInsight.mockResolvedValue(mockRejectedResponse);

      const { result } = renderHook(() => useInsights(mockToken));

      await act(async () => {
        await result.current.submitQuery('p1', 'Should I sell AAPL?');
      });

      expect(result.current.currentInsight?.rejected).toBe(true);
      expect(result.current.currentInsight?.insights).toContain('unable to provide financial advice');
    });
  });

  // --- Error Handling ---

  describe('Error Handling', () => {
    it('should set error on API failure', async () => {
      mockGenerateInsight.mockRejectedValue(new Error('Service unavailable'));

      const { result } = renderHook(() => useInsights(mockToken));

      await act(async () => {
        await result.current.submitQuery('p1', 'Test');
      });

      expect(result.current.error).toBe('Service unavailable');
      expect(result.current.currentInsight).toBeNull();
    });

    it('should clear error on next successful submission', async () => {
      mockGenerateInsight
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce(mockInsightResponse);

      const { result } = renderHook(() => useInsights(mockToken));

      await act(async () => {
        await result.current.submitQuery('p1', 'First');
      });

      expect(result.current.error).toBe('Temporary error');

      await act(async () => {
        await result.current.submitQuery('p1', 'Second');
      });

      expect(result.current.error).toBeNull();
    });
  });

  // --- Clear Functions ---

  describe('Clear Functions', () => {
    it('should clear current insight', async () => {
      mockGenerateInsight.mockResolvedValue(mockInsightResponse);

      const { result } = renderHook(() => useInsights(mockToken));

      await act(async () => {
        await result.current.submitQuery('p1', 'Test');
      });

      expect(result.current.currentInsight).not.toBeNull();

      act(() => {
        result.current.clearInsight();
      });

      expect(result.current.currentInsight).toBeNull();
    });

    it('should clear history', async () => {
      mockGenerateInsight.mockResolvedValue(mockInsightResponse);

      const { result } = renderHook(() => useInsights(mockToken));

      await act(async () => {
        await result.current.submitQuery('p1', 'Test');
      });

      expect(result.current.history).toHaveLength(1);

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.history).toHaveLength(0);
    });

    it('should clear error when clearing insight', async () => {
      mockGenerateInsight.mockRejectedValue(new Error('Error'));

      const { result } = renderHook(() => useInsights(mockToken));

      await act(async () => {
        await result.current.submitQuery('p1', 'Test');
      });

      expect(result.current.error).toBe('Error');

      act(() => {
        result.current.clearInsight();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
