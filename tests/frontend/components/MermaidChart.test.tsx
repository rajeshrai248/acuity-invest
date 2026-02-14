// ============================================================
// Acuity Invest — MermaidChart Component Tests
// Tests for Mermaid.js chart initialization and rendering
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React, { useEffect, useRef } from 'react';

// --------------- Mock Mermaid ---------------

const mockMermaidInit = vi.fn();
const mockMermaidRender = vi.fn();

vi.mock('mermaid', () => ({
  default: {
    initialize: mockMermaidInit,
    render: mockMermaidRender,
  },
}));

// --------------- Component Mock ---------------

interface MermaidChartProps {
  code: string;
  id?: string;
}

function MermaidChart({ code, id = 'mermaid-diagram' }: MermaidChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = React.useState<string>('');
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    const mermaid = require('mermaid').default;
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'strict',
    });

    const renderChart = async () => {
      try {
        const { svg: renderedSvg } = await mermaid.render(id, code);
        setSvg(renderedSvg);
        setError(null);
      } catch (err: any) {
        setError(`Failed to render chart: ${err.message}`);
        setSvg('');
      }
    };

    if (code.trim()) {
      renderChart();
    }
  }, [code, id]);

  if (error) {
    return (
      <div data-testid="mermaid-error" className="chart-error">
        <p>{error}</p>
      </div>
    );
  }

  if (!svg && !code.trim()) {
    return (
      <div data-testid="mermaid-empty">
        <p>No chart data provided</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-testid="mermaid-container"
      className="mermaid-chart"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

// --------------- Tests ---------------

describe('MermaidChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMermaidRender.mockResolvedValue({ svg: '<svg>mock chart</svg>' });
  });

  // --- Initialization ---

  describe('Initialization', () => {
    it('should initialize Mermaid with correct config', async () => {
      render(<MermaidChart code="pie title Test\n    'A' : 50\n    'B' : 50" />);

      await waitFor(() => {
        expect(mockMermaidInit).toHaveBeenCalledWith(
          expect.objectContaining({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'strict',
          })
        );
      });
    });

    it('should set securityLevel to strict', async () => {
      render(<MermaidChart code="graph LR\n    A --> B" />);

      await waitFor(() => {
        expect(mockMermaidInit).toHaveBeenCalledWith(
          expect.objectContaining({ securityLevel: 'strict' })
        );
      });
    });
  });

  // --- Rendering ---

  describe('Chart Rendering', () => {
    it('should call mermaid.render with chart code', async () => {
      const code = 'pie title Portfolio\n    "AAPL" : 37\n    "MSFT" : 48';
      render(<MermaidChart code={code} />);

      await waitFor(() => {
        expect(mockMermaidRender).toHaveBeenCalledWith('mermaid-diagram', code);
      });
    });

    it('should render SVG output into container', async () => {
      mockMermaidRender.mockResolvedValue({ svg: '<svg data-testid="rendered-svg">chart content</svg>' });

      render(<MermaidChart code="pie title Test\n    'A' : 100" />);

      await waitFor(() => {
        const container = screen.getByTestId('mermaid-container');
        expect(container.innerHTML).toContain('chart content');
      });
    });

    it('should use custom id when provided', async () => {
      render(<MermaidChart code="graph LR\n    A --> B" id="custom-chart-1" />);

      await waitFor(() => {
        expect(mockMermaidRender).toHaveBeenCalledWith('custom-chart-1', expect.any(String));
      });
    });

    it('should re-render when code changes', async () => {
      const { rerender } = render(<MermaidChart code="pie title V1\n    'A' : 100" />);

      await waitFor(() => {
        expect(mockMermaidRender).toHaveBeenCalledTimes(1);
      });

      rerender(<MermaidChart code="pie title V2\n    'B' : 100" />);

      await waitFor(() => {
        expect(mockMermaidRender).toHaveBeenCalledTimes(2);
      });
    });
  });

  // --- Error Handling ---

  describe('Error Handling', () => {
    it('should display error when Mermaid rendering fails', async () => {
      mockMermaidRender.mockRejectedValue(new Error('Invalid syntax'));

      render(<MermaidChart code="invalid mermaid syntax" />);

      await waitFor(() => {
        expect(screen.getByTestId('mermaid-error')).toBeInTheDocument();
        expect(screen.getByText(/Failed to render chart/)).toBeInTheDocument();
      });
    });

    it('should handle empty chart code', () => {
      render(<MermaidChart code="" />);
      expect(screen.getByTestId('mermaid-empty')).toBeInTheDocument();
    });

    it('should handle whitespace-only chart code', () => {
      render(<MermaidChart code="   " />);
      expect(screen.getByTestId('mermaid-empty')).toBeInTheDocument();
    });
  });

  // --- Supported Chart Types ---

  describe('Chart Types', () => {
    it('should render pie chart', async () => {
      render(<MermaidChart code='pie title Distribution\n    "A" : 40\n    "B" : 60' />);

      await waitFor(() => {
        expect(mockMermaidRender).toHaveBeenCalled();
      });
    });

    it('should render flowchart', async () => {
      render(<MermaidChart code="graph TD\n    A[Start] --> B[End]" />);

      await waitFor(() => {
        expect(mockMermaidRender).toHaveBeenCalled();
      });
    });

    it('should render bar chart (xychart)', async () => {
      render(
        <MermaidChart code='xychart-beta\n    title "Performance"\n    x-axis ["Q1", "Q2"]\n    y-axis 0 --> 100\n    bar [30, 70]' />
      );

      await waitFor(() => {
        expect(mockMermaidRender).toHaveBeenCalled();
      });
    });
  });
});
