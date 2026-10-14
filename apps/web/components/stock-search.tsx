'use client';

import { useState } from 'react';

interface StockSearchProps {
  onSubmit: (symbol: string, holdingHorizon: 'swing' | 'position') => void;
  loading?: boolean;
}

export function StockSearch({ onSubmit, loading }: StockSearchProps) {
  const [symbol, setSymbol] = useState('');
  const [horizon, setHorizon] = useState<'swing' | 'position'>('swing');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = symbol.trim().toUpperCase();
    if (!/^[A-Z0-9]{2,10}$/.test(trimmed)) {
      setError('Mã CP không hợp lệ (2–10 ký tự, chữ và số)');
      return;
    }
    setError('');
    onSubmit(trimmed, horizon);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
      <div className="flex flex-col gap-1 flex-1">
        <label className="text-xs text-gray-400 uppercase tracking-wide">Mã chứng khoán</label>
        <input
          type="text"
          value={symbol}
          onChange={e => { setSymbol(e.target.value); setError(''); }}
          placeholder="VD: MBB, FPT, HPG"
          className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 uppercase w-full sm:w-40"
          maxLength={10}
          autoComplete="off"
          spellCheck={false}
        />
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400 uppercase tracking-wide">Khung thời gian</label>
        <select
          disabled
          className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-400 cursor-not-allowed"
        >
          <option>1D</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400 uppercase tracking-wide">Horizon</label>
        <select
          value={horizon}
          onChange={e => setHorizon(e.target.value as 'swing' | 'position')}
          className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:outline-none focus:border-blue-500"
        >
          <option value="swing">Ngắn hạn (Swing)</option>
          <option value="position">Trung/Dài hạn (Position)</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:text-blue-500 text-white rounded px-5 py-2 font-medium transition-colors"
      >
        {loading ? 'Đang phân tích…' : 'Phân tích'}
      </button>
    </form>
  );
}
