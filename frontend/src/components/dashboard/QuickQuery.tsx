import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function QuickQuery() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      navigate('/insights', { state: { query: query.trim() } });
    }
  }

  return (
    <div className="bg-gradient-to-r from-[#FF6200] to-orange-500 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={20} className="text-white" />
        <h3 className="text-lg font-semibold text-white">AI Portfolio Insights</h3>
      </div>
      <p className="text-orange-100 text-sm mb-4">
        Ask anything about your portfolio and get AI-powered analysis with charts and recommendations.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Ask about your portfolio..."
          className="flex-1 px-4 py-2.5 rounded-lg bg-white/90 backdrop-blur text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 transition-shadow"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-white text-[#FF6200] rounded-lg font-semibold text-sm hover:bg-orange-50 transition-colors flex items-center gap-1.5 shadow-sm"
        >
          Analyze
          <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
}
