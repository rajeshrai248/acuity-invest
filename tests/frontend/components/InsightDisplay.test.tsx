// ============================================================
// Acuity Invest — InsightDisplay Component Tests
// Tests for markdown rendering, Mermaid chart extraction, and states
// ============================================================

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// --------------- Mock Data ---------------

const mockInsightWithMarkdown = {
  insights: `## Portfolio Performance Overview

| Metric | Value |
|--------|-------|
| Total Value | $26,350.00 |
| Total Gain/Loss | +$5,600.00 (+27.0%) |
| Day Change | +0.15% |

### Key Observations

1. **Strong Tech Performance**: Your technology holdings are driving gains.
2. **Concentration Risk**: ~85% in tech stocks.
3. **PG Underperformance**: Procter & Gamble at -5.88% loss.`,
  scratchpad: 'Analyzing portfolio composition and sector allocation.',
};

const mockInsightWithMermaid = {
  insights: `## Portfolio Allocation

Here is your portfolio breakdown:

\`\`\`mermaid
pie title Portfolio Allocation
    "AAPL" : 37
    "MSFT" : 48
    "PG" : 15
\`\`\`

### Performance Flow

\`\`\`mermaid
graph LR
    A[Total Value: $26,350] --> B[Gain: +$5,600]
    B --> C[Return: +27.0%]
\`\`\`

The charts above illustrate your portfolio structure.`,
  scratchpad: 'Premium user - including visual charts.',
};

const mockEmptyInsight = {
  insights: '',
  scratchpad: '',
};

// --------------- Component Mock ---------------

interface InsightDisplayProps {
  insights: string;
  scratchpad?: string;
  isLoading?: boolean;
  error?: string | null;
}

function MermaidChart({ code }: { code: string }) {
  return <div data-testid="mermaid-chart" className="mermaid">{code}</div>;
}

function InsightDisplay({ insights, scratchpad, isLoading, error }: InsightDisplayProps) {
  if (isLoading) {
    return (
      <div data-testid="insight-loading">
        <div data-testid="loading-skeleton" className="animate-pulse">
          <div className="skeleton-line" />
          <div className="skeleton-line" />
          <div className="skeleton-line" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="insight-error" className="error-state">
        <span data-testid="error-message">{error}</span>
      </div>
    );
  }

  if (!insights) {
    return (
      <div data-testid="insight-empty">
        <p>No insights available. Submit a query to get started.</p>
      </div>
    );
  }

  // Parse and separate Mermaid code blocks
  const parts = insights.split(/(```mermaid[\s\S]*?```)/g);

  return (
    <div data-testid="insight-display">
      {scratchpad && (
        <details data-testid="scratchpad-section">
          <summary>AI Thinking Process</summary>
          <pre data-testid="scratchpad-content">{scratchpad}</pre>
        </details>
      )}

      <div data-testid="insight-content">
        {parts.map((part, index) => {
          if (part.startsWith('```mermaid')) {
            const code = part.replace(/```mermaid\n?/, '').replace(/\n?```$/, '');
            return <MermaidChart key={index} code={code} />;
          }
          // Render as markdown-like HTML
          const html = part
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\|(.+)\|/g, '<tr><td>$1</td></tr>')
            .replace(/^\d+\.\s(.+)$/gm, '<li>$1</li>');

          return (
            <div
              key={index}
              data-testid="markdown-section"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        })}
      </div>
    </div>
  );
}

// --------------- Tests ---------------

describe('InsightDisplay', () => {
  // --- Markdown Rendering ---

  describe('Markdown Content', () => {
    it('should render markdown content', () => {
      render(
        <InsightDisplay
          insights={mockInsightWithMarkdown.insights}
          scratchpad={mockInsightWithMarkdown.scratchpad}
        />
      );
      expect(screen.getByTestId('insight-display')).toBeInTheDocument();
      expect(screen.getByTestId('insight-content')).toBeInTheDocument();
    });

    it('should render section headers', () => {
      render(<InsightDisplay insights={mockInsightWithMarkdown.insights} />);
      const content = screen.getByTestId('insight-content');
      expect(content.innerHTML).toContain('Portfolio Performance Overview');
    });

    it('should render tables with proper formatting', () => {
      render(<InsightDisplay insights={mockInsightWithMarkdown.insights} />);
      const content = screen.getByTestId('insight-content');
      expect(content.innerHTML).toContain('$26,350.00');
      expect(content.innerHTML).toContain('+$5,600.00');
    });

    it('should render bold text', () => {
      render(<InsightDisplay insights={mockInsightWithMarkdown.insights} />);
      const content = screen.getByTestId('insight-content');
      expect(content.innerHTML).toContain('<strong>Strong Tech Performance</strong>');
    });

    it('should render numbered list items', () => {
      render(<InsightDisplay insights={mockInsightWithMarkdown.insights} />);
      const content = screen.getByTestId('insight-content');
      expect(content.innerHTML).toContain('Concentration Risk');
    });
  });

  // --- Mermaid Charts ---

  describe('Mermaid Chart Extraction', () => {
    it('should identify and extract Mermaid code blocks', () => {
      render(<InsightDisplay insights={mockInsightWithMermaid.insights} />);
      const mermaidCharts = screen.getAllByTestId('mermaid-chart');
      expect(mermaidCharts).toHaveLength(2);
    });

    it('should render Mermaid pie chart', () => {
      render(<InsightDisplay insights={mockInsightWithMermaid.insights} />);
      const charts = screen.getAllByTestId('mermaid-chart');
      expect(charts[0].textContent).toContain('pie title Portfolio Allocation');
    });

    it('should render Mermaid graph chart', () => {
      render(<InsightDisplay insights={mockInsightWithMermaid.insights} />);
      const charts = screen.getAllByTestId('mermaid-chart');
      expect(charts[1].textContent).toContain('graph LR');
    });

    it('should render non-Mermaid text alongside charts', () => {
      render(<InsightDisplay insights={mockInsightWithMermaid.insights} />);
      const content = screen.getByTestId('insight-content');
      expect(content.textContent).toContain('Portfolio Allocation');
      expect(content.textContent).toContain('charts above illustrate');
    });
  });

  // --- Scratchpad ---

  describe('Scratchpad Section', () => {
    it('should render scratchpad in a collapsible section', () => {
      render(
        <InsightDisplay
          insights={mockInsightWithMarkdown.insights}
          scratchpad={mockInsightWithMarkdown.scratchpad}
        />
      );
      expect(screen.getByTestId('scratchpad-section')).toBeInTheDocument();
    });

    it('should display scratchpad content', () => {
      render(
        <InsightDisplay
          insights={mockInsightWithMarkdown.insights}
          scratchpad="Analyzing portfolio composition."
        />
      );
      expect(screen.getByTestId('scratchpad-content')).toHaveTextContent(
        'Analyzing portfolio composition.'
      );
    });

    it('should not render scratchpad section when not provided', () => {
      render(<InsightDisplay insights={mockInsightWithMarkdown.insights} />);
      expect(screen.queryByTestId('scratchpad-section')).not.toBeInTheDocument();
    });
  });

  // --- Loading State ---

  describe('Loading State', () => {
    it('should show loading skeleton during API call', () => {
      render(<InsightDisplay insights="" isLoading={true} />);
      expect(screen.getByTestId('insight-loading')).toBeInTheDocument();
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });

    it('should not show content during loading', () => {
      render(<InsightDisplay insights="Some content" isLoading={true} />);
      expect(screen.queryByTestId('insight-display')).not.toBeInTheDocument();
    });
  });

  // --- Error State ---

  describe('Error State', () => {
    it('should show error state on failure', () => {
      render(<InsightDisplay insights="" error="Failed to generate insights" />);
      expect(screen.getByTestId('insight-error')).toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Failed to generate insights'
      );
    });

    it('should not show content when error is present', () => {
      render(<InsightDisplay insights="Some content" error="Error occurred" />);
      expect(screen.queryByTestId('insight-display')).not.toBeInTheDocument();
    });
  });

  // --- Empty State ---

  describe('Empty State', () => {
    it('should handle empty insights gracefully', () => {
      render(<InsightDisplay insights="" />);
      expect(screen.getByTestId('insight-empty')).toBeInTheDocument();
      expect(screen.getByText(/Submit a query/)).toBeInTheDocument();
    });
  });
});
