import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MermaidChart from './MermaidChart';
import ChartRenderer from '../charts/ChartRenderer';
import type { Components } from 'react-markdown';
import type { ChartData } from '../../types/charts';

interface InsightDisplayProps {
  content: string;
}

interface ContentBlock {
  type: 'markdown' | 'mermaid' | 'chart';
  content: string;
  id?: string;
  chartData?: ChartData;
}

function parseContent(content: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const chartRegex = /```(mermaid|chart-data)\s*\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let chartIndex = 0;

  while ((match = chartRegex.exec(content)) !== null) {
    const textBefore = content.slice(lastIndex, match.index);
    if (textBefore.trim()) {
      blocks.push({ type: 'markdown', content: textBefore.trim() });
    }

    const blockType = match[1];
    const blockContent = match[2].trim();

    if (blockType === 'chart-data') {
      try {
        const parsed = JSON.parse(blockContent);
        if (parsed && parsed.type && parsed.data) {
          blocks.push({
            type: 'chart',
            content: blockContent,
            chartData: parsed as ChartData,
            id: `insight-chart-${chartIndex++}`,
          });
        } else {
          blocks.push({
            type: 'mermaid',
            content: blockContent,
            id: `insight-chart-${chartIndex++}`,
          });
        }
      } catch {
        blocks.push({
          type: 'mermaid',
          content: blockContent,
          id: `insight-chart-${chartIndex++}`,
        });
      }
    } else {
      blocks.push({
        type: 'mermaid',
        content: blockContent,
        id: `insight-chart-${chartIndex++}`,
      });
    }

    lastIndex = match.index + match[0].length;
  }

  const remaining = content.slice(lastIndex);
  if (remaining.trim()) {
    blocks.push({ type: 'markdown', content: remaining.trim() });
  }

  return blocks;
}

const markdownComponents: Components = {
  h2: ({ children }) => (
    <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-100 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">{children}</h3>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-4 rounded-lg border border-gray-200">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-gray-50 border-b border-gray-200">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
      {children}
    </th>
  ),
  td: ({ children }) => {
    const text = String(children);
    // Color code gain/loss values
    const isPositive = text.includes('+') && (text.includes('%') || text.includes('$'));
    const isNegative = text.startsWith('-') && (text.includes('%') || text.includes('$'));
    const isBold = text.startsWith('**') || text.includes('**');

    let className = 'px-4 py-2.5 text-gray-700 tabular-nums';
    if (isPositive) className += ' text-green-600 font-medium';
    if (isNegative) className += ' text-red-600 font-medium';
    if (isBold) className += ' font-semibold text-gray-900';

    return <td className={className}>{children}</td>;
  },
  tr: ({ children }) => (
    <tr className="border-b border-gray-50 hover:bg-orange-50/20 transition-colors">
      {children}
    </tr>
  ),
  hr: () => <hr className="my-6 border-gray-200" />,
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-900">{children}</strong>
  ),
  ol: ({ children }) => (
    <ol className="my-4 space-y-2 list-decimal list-inside">{children}</ol>
  ),
  ul: ({ children }) => (
    <ul className="my-4 space-y-2 list-disc list-inside">{children}</ul>
  ),
  li: ({ children }) => (
    <li className="text-sm text-gray-700 leading-relaxed">{children}</li>
  ),
  p: ({ children }) => (
    <p className="text-sm text-gray-700 leading-relaxed my-2">{children}</p>
  ),
  code: ({ children, className }) => {
    // Inline code (not a code block)
    if (!className) {
      return (
        <code className="px-1.5 py-0.5 bg-gray-100 rounded text-sm font-mono text-gray-800">
          {children}
        </code>
      );
    }
    return <code className={className}>{children}</code>;
  },
  pre: ({ children }) => (
    <pre className="my-4 p-4 bg-gray-50 rounded-lg overflow-x-auto text-sm">{children}</pre>
  ),
};

export default function InsightDisplay({ content }: InsightDisplayProps) {
  const blocks = useMemo(() => parseContent(content), [content]);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 md:p-8 insight-display">
      {blocks.map((block, index) => (
        <div key={index}>
          {block.type === 'chart' && block.chartData ? (
            <ChartRenderer data={block.chartData} />
          ) : block.type === 'mermaid' ? (
            <MermaidChart chart={block.content} id={block.id} />
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {block.content}
            </ReactMarkdown>
          )}
        </div>
      ))}
    </div>
  );
}
