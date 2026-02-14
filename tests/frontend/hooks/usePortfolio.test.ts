// ============================================================
// Acuity Invest — usePortfolio Hook Tests
// Tests for portfolio state management hook
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// --------------- Mock API ---------------

const mockFetchPortfolios = vi.fn();
const mockFetchPortfolio = vi.fn();
const mockCreatePortfolio = vi.fn();
const mockDeletePortfolio = vi.fn();
const mockAddHolding = vi.fn();
const mockDeleteHolding = vi.fn();

// --------------- Mock Data ---------------

const mockPortfolios = [
  { id: 'p1', user_id: 'u1', name: 'Growth Portfolio', account_type: 'INDIVIDUAL', base_currency: 'USD', created_at: '2025-01-15' },
  { id: 'p2', user_id: 'u1', name: 'Retirement', account_type: 'IRA', base_currency: 'USD', created_at: '2025-02-01' },
];

const mockPortfolioWithHoldings = {
  ...mockPortfolios[0],
  holdings: [
    { id: 'h1', portfolio_id: 'p1', ticker: 'AAPL', name: 'Apple Inc.', shares: 50, avg_cost: 150, purchase_date: '2024-06-01' },
    { id: 'h2', portfolio_id: 'p1', ticker: 'MSFT', name: 'Microsoft', shares: 30, avg_cost: 300, purchase_date: '2024-07-15' },
  ],
};

// --------------- Hook Implementation ---------------

import { useState, useCallback } from 'react';

interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  account_type: string;
  base_currency: string;
  created_at: string;
  holdings?: any[];
}

function usePortfolio(token: string) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolios = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await mockFetchPortfolios(token);
      setPortfolios(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const fetchPortfolio = useCallback(async (portfolioId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await mockFetchPortfolio(portfolioId, token);
      setSelectedPortfolio(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const createPortfolio = useCallback(async (name: string, accountType: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const newPortfolio = await mockCreatePortfolio(name, accountType, token);
      setPortfolios((prev) => [...prev, newPortfolio]);
      return newPortfolio;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const deletePortfolio = useCallback(async (portfolioId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await mockDeletePortfolio(portfolioId, token);
      setPortfolios((prev) => prev.filter((p) => p.id !== portfolioId));
      if (selectedPortfolio?.id === portfolioId) {
        setSelectedPortfolio(null);
      }
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [token, selectedPortfolio]);

  const addHolding = useCallback(async (portfolioId: string, holdingData: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const newHolding = await mockAddHolding(portfolioId, holdingData, token);
      if (selectedPortfolio?.id === portfolioId) {
        setSelectedPortfolio((prev) => {
          if (!prev) return prev;
          return { ...prev, holdings: [...(prev.holdings || []), newHolding] };
        });
      }
      return newHolding;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [token, selectedPortfolio]);

  const deleteHolding = useCallback(async (portfolioId: string, holdingId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await mockDeleteHolding(portfolioId, holdingId, token);
      if (selectedPortfolio?.id === portfolioId) {
        setSelectedPortfolio((prev) => {
          if (!prev) return prev;
          return { ...prev, holdings: (prev.holdings || []).filter((h: any) => h.id !== holdingId) };
        });
      }
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [token, selectedPortfolio]);

  return {
    portfolios,
    selectedPortfolio,
    isLoading,
    error,
    fetchPortfolios,
    fetchPortfolio,
    createPortfolio,
    deletePortfolio,
    addHolding,
    deleteHolding,
  };
}

// --------------- Tests ---------------

describe('usePortfolio', () => {
  const mockToken = 'Bearer test-token';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Fetching Portfolios ---

  describe('fetchPortfolios', () => {
    it('should fetch and store portfolios', async () => {
      mockFetchPortfolios.mockResolvedValue(mockPortfolios);

      const { result } = renderHook(() => usePortfolio(mockToken));

      await act(async () => {
        await result.current.fetchPortfolios();
      });

      expect(result.current.portfolios).toHaveLength(2);
      expect(result.current.portfolios[0].name).toBe('Growth Portfolio');
      expect(result.current.isLoading).toBe(false);
    });

    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: any) => void;
      mockFetchPortfolios.mockImplementation(
        () => new Promise((resolve) => { resolvePromise = resolve; })
      );

      const { result } = renderHook(() => usePortfolio(mockToken));

      act(() => {
        result.current.fetchPortfolios();
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!(mockPortfolios);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should set error on fetch failure', async () => {
      mockFetchPortfolios.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => usePortfolio(mockToken));

      await act(async () => {
        await result.current.fetchPortfolios();
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.portfolios).toHaveLength(0);
    });

    it('should pass token to API call', async () => {
      mockFetchPortfolios.mockResolvedValue([]);

      const { result } = renderHook(() => usePortfolio(mockToken));

      await act(async () => {
        await result.current.fetchPortfolios();
      });

      expect(mockFetchPortfolios).toHaveBeenCalledWith(mockToken);
    });
  });

  // --- Fetching Single Portfolio ---

  describe('fetchPortfolio', () => {
    it('should fetch and set selected portfolio with holdings', async () => {
      mockFetchPortfolio.mockResolvedValue(mockPortfolioWithHoldings);

      const { result } = renderHook(() => usePortfolio(mockToken));

      await act(async () => {
        await result.current.fetchPortfolio('p1');
      });

      expect(result.current.selectedPortfolio).toBeDefined();
      expect(result.current.selectedPortfolio?.name).toBe('Growth Portfolio');
      expect(result.current.selectedPortfolio?.holdings).toHaveLength(2);
    });

    it('should set error when portfolio not found', async () => {
      mockFetchPortfolio.mockRejectedValue(new Error('Portfolio not found'));

      const { result } = renderHook(() => usePortfolio(mockToken));

      await act(async () => {
        await result.current.fetchPortfolio('non-existent');
      });

      expect(result.current.error).toBe('Portfolio not found');
      expect(result.current.selectedPortfolio).toBeNull();
    });
  });

  // --- Creating Portfolio ---

  describe('createPortfolio', () => {
    it('should create and add portfolio to list', async () => {
      const newPortfolio = { id: 'p3', user_id: 'u1', name: 'New Portfolio', account_type: 'INDIVIDUAL', base_currency: 'USD', created_at: '2025-02-14' };
      mockCreatePortfolio.mockResolvedValue(newPortfolio);

      const { result } = renderHook(() => usePortfolio(mockToken));

      let created: any;
      await act(async () => {
        created = await result.current.createPortfolio('New Portfolio', 'INDIVIDUAL');
      });

      expect(created).toEqual(newPortfolio);
      expect(result.current.portfolios).toHaveLength(1);
      expect(result.current.portfolios[0].name).toBe('New Portfolio');
    });

    it('should return null on creation failure', async () => {
      mockCreatePortfolio.mockRejectedValue(new Error('Portfolio limit reached'));

      const { result } = renderHook(() => usePortfolio(mockToken));

      let created: any;
      await act(async () => {
        created = await result.current.createPortfolio('Overflow', 'INDIVIDUAL');
      });

      expect(created).toBeNull();
      expect(result.current.error).toBe('Portfolio limit reached');
    });
  });

  // --- Deleting Portfolio ---

  describe('deletePortfolio', () => {
    it('should remove portfolio from list', async () => {
      mockFetchPortfolios.mockResolvedValue(mockPortfolios);
      mockDeletePortfolio.mockResolvedValue(true);

      const { result } = renderHook(() => usePortfolio(mockToken));

      await act(async () => {
        await result.current.fetchPortfolios();
      });

      expect(result.current.portfolios).toHaveLength(2);

      await act(async () => {
        await result.current.deletePortfolio('p1');
      });

      expect(result.current.portfolios).toHaveLength(1);
      expect(result.current.portfolios[0].id).toBe('p2');
    });

    it('should clear selectedPortfolio if it was deleted', async () => {
      mockFetchPortfolio.mockResolvedValue(mockPortfolioWithHoldings);
      mockDeletePortfolio.mockResolvedValue(true);

      const { result } = renderHook(() => usePortfolio(mockToken));

      await act(async () => {
        await result.current.fetchPortfolio('p1');
      });

      expect(result.current.selectedPortfolio?.id).toBe('p1');

      await act(async () => {
        await result.current.deletePortfolio('p1');
      });

      expect(result.current.selectedPortfolio).toBeNull();
    });
  });

  // --- Managing Holdings ---

  describe('addHolding', () => {
    it('should add holding to selected portfolio', async () => {
      mockFetchPortfolio.mockResolvedValue(mockPortfolioWithHoldings);
      const newHolding = { id: 'h3', portfolio_id: 'p1', ticker: 'PG', name: 'Procter & Gamble', shares: 25, avg_cost: 170 };
      mockAddHolding.mockResolvedValue(newHolding);

      const { result } = renderHook(() => usePortfolio(mockToken));

      await act(async () => {
        await result.current.fetchPortfolio('p1');
      });

      await act(async () => {
        await result.current.addHolding('p1', { ticker: 'PG', name: 'Procter & Gamble', shares: 25, avg_cost: 170 });
      });

      expect(result.current.selectedPortfolio?.holdings).toHaveLength(3);
    });
  });

  describe('deleteHolding', () => {
    it('should remove holding from selected portfolio', async () => {
      mockFetchPortfolio.mockResolvedValue(mockPortfolioWithHoldings);
      mockDeleteHolding.mockResolvedValue(true);

      const { result } = renderHook(() => usePortfolio(mockToken));

      await act(async () => {
        await result.current.fetchPortfolio('p1');
      });

      expect(result.current.selectedPortfolio?.holdings).toHaveLength(2);

      await act(async () => {
        await result.current.deleteHolding('p1', 'h1');
      });

      expect(result.current.selectedPortfolio?.holdings).toHaveLength(1);
      expect(result.current.selectedPortfolio?.holdings?.[0].ticker).toBe('MSFT');
    });
  });
});
