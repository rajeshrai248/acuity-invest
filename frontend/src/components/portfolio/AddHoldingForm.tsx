import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { Holding } from '../../types';

interface AddHoldingFormProps {
  onAdd: (holding: Omit<Holding, 'current_price'>) => Promise<void>;
  existingTickers: string[];
}

const initialFormState = {
  ticker: '',
  name: '',
  shares: '',
  avg_cost: '',
  purchase_date: '',
};

export default function AddHoldingForm({ onAdd, existingTickers }: AddHoldingFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'ticker' ? value.toUpperCase() : value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation
    if (!form.ticker.trim()) { setError('Ticker is required'); return; }
    if (!form.name.trim()) { setError('Company name is required'); return; }
    if (!form.shares || Number(form.shares) <= 0) { setError('Shares must be greater than 0'); return; }
    if (!form.avg_cost || Number(form.avg_cost) <= 0) { setError('Average cost must be greater than 0'); return; }
    if (!form.purchase_date) { setError('Purchase date is required'); return; }
    if (existingTickers.includes(form.ticker.trim())) { setError('This ticker already exists in your portfolio'); return; }

    setSubmitting(true);
    try {
      await onAdd({
        ticker: form.ticker.trim(),
        name: form.name.trim(),
        shares: Number(form.shares),
        avg_cost: Number(form.avg_cost),
        purchase_date: form.purchase_date,
      });
      setForm(initialFormState);
      setIsOpen(false);
    } catch {
      setError('Failed to add holding. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6200] text-white rounded-lg font-semibold text-sm hover:bg-orange-600 transition-colors shadow-sm"
      >
        <Plus size={18} />
        Add Holding
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-gray-900">Add New Holding</h3>
        <button
          onClick={() => { setIsOpen(false); setError(null); }}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ticker Symbol</label>
          <input
            type="text"
            name="ticker"
            value={form.ticker}
            onChange={handleChange}
            placeholder="e.g., AAPL"
            maxLength={10}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6200]/30 focus:border-[#FF6200] transition-all"
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g., Apple Inc."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6200]/30 focus:border-[#FF6200] transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Shares</label>
          <input
            type="number"
            name="shares"
            value={form.shares}
            onChange={handleChange}
            placeholder="0"
            min="0.01"
            step="any"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#FF6200]/30 focus:border-[#FF6200] transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Average Cost ($)</label>
          <input
            type="number"
            name="avg_cost"
            value={form.avg_cost}
            onChange={handleChange}
            placeholder="0.00"
            min="0.01"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#FF6200]/30 focus:border-[#FF6200] transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
          <input
            type="date"
            name="purchase_date"
            value={form.purchase_date}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6200]/30 focus:border-[#FF6200] transition-all"
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => { setIsOpen(false); setError(null); }}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-[#FF6200] text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            Add Holding
          </button>
        </div>
      </form>
    </div>
  );
}
