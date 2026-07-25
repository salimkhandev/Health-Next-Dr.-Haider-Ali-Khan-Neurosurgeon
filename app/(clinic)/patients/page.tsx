'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiSearch, FiPlus, FiUser, FiChevronRight, FiLoader } from 'react-icons/fi';
import { FaUserInjured, FaHeartbeat } from 'react-icons/fa';
import RegisterPatientModal, { type Patient } from '@/components/patients/RegisterPatientModal';
import { useDebounce } from '@/lib/hooks/useDebounce';

function GenderBadge({ gender }: { gender: string }) {
  const map: Record<string, string> = {
    Male: 'bg-blue-50 text-blue-700 border-blue-200',
    Female: 'bg-pink-50 text-pink-700 border-pink-200',
    Other: 'bg-purple-50 text-purple-700 border-purple-200',
  };
  return (
    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${map[gender] ?? map.Other}`}>
      {gender}
    </span>
  );
}

export default function PatientsPage() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 350);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const fetchPatients = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/patients?q=${encodeURIComponent(query)}&limit=30`);
      const data = await res.json();
      setPatients(data.patients ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPatients(debouncedQ); }, [debouncedQ, fetchPatients]);

  function handleCreated(patient: Patient) {
    setShowRegister(false);
    router.push(`/patients/${patient.mrn}`);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="section-title flex items-center gap-1.5 text-base sm:text-xl">
            <FaUserInjured className="text-blue-500 shrink-0" />
            <span className="hidden sm:inline">Patient Directory</span>
            <span className="sm:hidden">Patients</span>
          </h1>
          <p className="section-subtitle mt-0.5 text-[10px] sm:text-sm hidden sm:block">Search by MRN, name, or phone</p>
        </div>
        <button onClick={() => setShowRegister(true)} className="btn-primary shrink-0">
          <FiPlus />
          <span className="hidden sm:inline">Register New Patient</span>
          <span className="sm:hidden">Register</span>
        </button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none z-10" />
        <input
          className="input pl-9 shadow-xs"
          placeholder="MRN, name, contact..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
        {loading && (
          <FiLoader className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-blue-400 text-sm pointer-events-none z-10" />
        )}
      </div>

      {/* Results */}
      {patients.length === 0 && !loading ? (
        <div className="card flex flex-col items-center justify-center py-12 sm:py-20 text-center px-4">
          <FaHeartbeat className="text-4xl sm:text-5xl text-slate-200 mb-3" />
          <p className="text-slate-500 font-semibold text-sm sm:text-base">
            {q ? 'No patients found matching your search.' : 'No patients registered yet.'}
          </p>
          {q && (
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Try a different name, MRN, or phone number — or{' '}
              <button className="text-blue-600 font-semibold hover:underline" onClick={() => setShowRegister(true)}>
                register a new patient.
              </button>
            </p>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-400 font-medium px-1">
            {loading ? 'Searching...' : `${total} patient${total !== 1 ? 's' : ''} found`}
          </p>
          <div className="card overflow-hidden divide-y divide-slate-100">
            {patients.map((p) => (
              <Link
                key={p.mrn}
                href={`/patients/${p.mrn}`}
                className="flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 hover:bg-blue-50/50 transition-colors group"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shrink-0 font-bold text-blue-600 text-sm uppercase border border-blue-200">
                  {p.fullName.charAt(0)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 text-xs sm:text-sm">{p.fullName}</span>
                    <GenderBadge gender={p.gender} />
                    {p.allergies?.length > 0 && (
                      <span className="tag-red text-[10px] px-1.5 py-0.5">
                        ⚠ Allergies
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[11px] sm:text-xs text-slate-500">
                    <span className="font-mono font-bold text-blue-700">{p.mrn}</span>
                    <span className="hidden sm:inline">·</span>
                    <span>Age {p.age}</span>
                    <span>·</span>
                    <span className="truncate">{p.contact}</span>
                    <span className="hidden sm:inline">·</span>
                    <span className="flex items-center gap-1 font-medium text-slate-600">
                      <FiUser className="text-slate-400 text-xs" />
                      {p.visitCount} visit{p.visitCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <FiChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors text-base sm:text-lg shrink-0" />
              </Link>
            ))}
          </div>
        </>
      )}

      {showRegister && (
        <RegisterPatientModal
          onClose={() => setShowRegister(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
