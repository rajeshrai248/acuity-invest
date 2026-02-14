import { useState } from 'react';
import { ChevronDown, ChevronRight, Brain } from 'lucide-react';

interface ScratchpadProps {
  content: string;
}

export default function Scratchpad({ content }: ScratchpadProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!content) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-amber-100/50 transition-colors"
      >
        <Brain size={16} className="text-amber-600" />
        <span className="text-sm font-medium text-amber-800">AI Reasoning (Scratchpad)</span>
        {isOpen ? (
          <ChevronDown size={16} className="text-amber-500 ml-auto" />
        ) : (
          <ChevronRight size={16} className="text-amber-500 ml-auto" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 border-t border-amber-200">
          <pre className="mt-3 text-sm text-amber-900 whitespace-pre-wrap font-mono leading-relaxed">
            {content}
          </pre>
        </div>
      )}
    </div>
  );
}
