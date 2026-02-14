import { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { suggestedQueries } from '../../data/mockData';

interface QueryInputProps {
  onSubmit: (query: string) => void;
  loading: boolean;
  initialQuery?: string;
}

export default function QueryInput({ onSubmit, loading, initialQuery = '' }: QueryInputProps) {
  const [query, setQuery] = useState(initialQuery);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim() && !loading) {
      onSubmit(query.trim());
    }
  }

  function handleSuggestionClick(suggestion: string) {
    setQuery(suggestion);
    onSubmit(suggestion);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask anything about your portfolio... e.g., 'Give me a comprehensive portfolio overview with charts'"
            rows={3}
            disabled={loading}
            className="w-full px-5 py-4 pr-14 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#FF6200]/30 focus:border-[#FF6200] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="absolute right-3 bottom-3 p-2.5 bg-[#FF6200] text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </form>

      {/* Suggested Queries */}
      <div>
        <div className="flex items-center gap-1.5 mb-2.5">
          <Sparkles size={14} className="text-[#FF6200]" />
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Suggested Queries</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestedQueries.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={loading}
              className="px-3 py-1.5 bg-orange-50 text-[#FF6200] rounded-lg text-xs font-medium hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-orange-100"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
