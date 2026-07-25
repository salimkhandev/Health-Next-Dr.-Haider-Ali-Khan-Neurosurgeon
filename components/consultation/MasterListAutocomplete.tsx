'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { FiPlus, FiLoader } from 'react-icons/fi';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface MasterItem {
  _id: string;
  type: 'medicine' | 'test';
  name: string;
  defaultDosage?: string;
}

interface Props {
  type: 'medicine' | 'test';
  placeholder?: string;
  onSelect: (item: MasterItem) => void;
  disabled?: boolean;
}

export default function MasterListAutocomplete({ type, placeholder, onSelect, disabled }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MasterItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debouncedQ = useDebounce(query, 250);
  const wrapRef = useRef<HTMLDivElement>(null);

  const fetchItems = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/master-list?type=${type}&q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.items ?? []);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => { fetchItems(debouncedQ); }, [debouncedQ, fetchItems]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleAddNew() {
    if (!query.trim()) return;
    const res = await fetch('/api/master-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, name: query.trim() }),
    });
    const data = await res.json();
    onSelect(data.item);
    setQuery('');
    setOpen(false);
  }

  function handleSelect(item: MasterItem) {
    onSelect(item);
    setQuery('');
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <input
          className="input pr-8"
          placeholder={placeholder ?? `Search ${type}s...`}
          value={query}
          disabled={disabled}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setOpen(true)}
        />
        {loading && (
          <FiLoader className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-blue-400 text-sm" />
        )}
      </div>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-56 overflow-y-auto">
          {results.map((item) => (
            <button
              key={item._id}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between group"
            >
              <span className="font-medium">{item.name}</span>
              {item.defaultDosage && (
                <span className="text-xs text-slate-400 group-hover:text-blue-400">{item.defaultDosage}</span>
              )}
            </button>
          ))}
          {/* Add new option if no exact match */}
          {query.trim() && !results.some((r) => r.name.toLowerCase() === query.toLowerCase()) && (
            <button
              type="button"
              onClick={handleAddNew}
              className="w-full text-left px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2 border-t border-slate-100 font-semibold"
            >
              <FiPlus /> Add &ldquo;{query}&rdquo; to master list
            </button>
          )}
          {results.length === 0 && !loading && (
            <p className="px-4 py-2.5 text-xs text-slate-400">
              No matches — type to add a new {type}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
