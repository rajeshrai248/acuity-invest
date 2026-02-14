import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidChartProps {
  chart: string;
  id?: string;
}

let chartCounter = 0;

export default function MermaidChart({ chart, id }: MermaidChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const uniqueId = useRef(id || `mermaid-chart-${++chartCounter}`);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        primaryColor: '#FF6200',
        primaryTextColor: '#1f2937',
        primaryBorderColor: '#e5e7eb',
        lineColor: '#9ca3af',
        secondaryColor: '#fed7aa',
        tertiaryColor: '#fff7ed',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '14px',
        pie1: '#FF6200',
        pie2: '#2563eb',
        pie3: '#16a34a',
        pie4: '#8b5cf6',
        pie5: '#ec4899',
        pie6: '#f59e0b',
        pie7: '#06b6d4',
        pie8: '#64748b',
      },
    });
  }, []);

  useEffect(() => {
    async function renderChart() {
      if (!chart.trim()) return;

      try {
        setError(null);
        // Sanitize xychart-beta: remove explicit y-axis numeric ranges that cause parse errors
        const sanitized = chart.trim().replace(
          /y-axis\s+"([^"]*)"\s+[\d\s.\-]+(?=\n)/g,
          'y-axis "$1"'
        );
        const { svg: renderedSvg } = await mermaid.render(uniqueId.current, sanitized);
        setSvg(renderedSvg);
      } catch (err) {
        console.error('Mermaid render error:', err);
        setError('Failed to render chart');
        // Clean up any error elements mermaid might have injected
        const errorEl = document.getElementById('d' + uniqueId.current);
        if (errorEl) errorEl.remove();
      }
    }

    renderChart();
  }, [chart]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600">
        <p className="font-medium">Chart rendering error</p>
        <pre className="mt-2 text-xs overflow-x-auto bg-red-100 rounded p-2">{chart}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-2 border-[#FF6200] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-4 flex justify-center bg-white rounded-lg border border-gray-100 p-4 overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
