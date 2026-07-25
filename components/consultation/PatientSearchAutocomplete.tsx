'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FiSearch, FiLoader, FiUser } from 'react-icons/fi';
import { useDebounce } from '@/lib/hooks/useDebounce';

import type { Patient } from '@/components/patients/RegisterPatientModal';

export type { Patient };

interface Props {
  onSelectPatient: (patient: Patient) => void;
}

export default function PatientSearchAutocomplete({ onSelectPatient }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debouncedQ = useDebounce(query, 250);
  const wrapRef = useRef<HTMLDivElement>(null);

  const searchPatients = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/patients?q=${encodeURIComponent(q)}&limit=8`);
      const data = await res.json();
      setResults(data.patients || []);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    searchPatients(debouncedQ);
  }, [debouncedQ, searchPatients]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(patient: Patient) {
    onSelectPatient(patient);
    setQuery('');
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative flex-1">
      <div className="relative">
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
        <input
          className="input pl-10 pr-9 py-2.5 text-sm shadow-xs"
          placeholder="Search by Patient Name, Phone Number, or MRN..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setOpen(true)}
          autoFocus
        />
        {loading && (
          <FiLoader className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-blue-500 text-base" />
        )}
      </div>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-100">
          {results.length > 0 ? (
            results.map((patient) => (
              <button
                key={patient.mrn}
                type="button"
                onClick={() => handleSelect(patient)}
                className="w-full text-left px-4 py-3 hover:bg-blue-50/70 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                    {patient.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm group-hover:text-blue-700">
                      {patient.fullName}
                    </p>
                    <p className="text-xs text-slate-500">
                      <span className="font-mono font-bold text-blue-600">{patient.mrn}</span> · {patient.gender}, Age {patient.age} · Phone: {patient.contact}
                    </p>
                  </div>
                </div>

                {patient.allergies?.length > 0 && (
                  <span className="tag-red text-[10px] shrink-0">
                    ⚠ Allergies
                  </span>
                )}
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-slate-400">
              No matching patients found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
