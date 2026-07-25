'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { FiLoader, FiClock, FiArrowRight, FiInbox, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import { FaFlask } from 'react-icons/fa';

interface DraftVisit {
  _id: string;
  mrn: string;
  patientName: string;
  visitDate: string;
  symptoms: string[];
  testsPrescribed: string[];
  doctorNotes: string;
}

export default function PendingResultsPage() {
  const [drafts, setDrafts] = useState<DraftVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/visits/drafts');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Failed to load (HTTP ${res.status})`);
        setDrafts([]);
        return;
      }
      setDrafts(data.drafts ?? []);
    } catch {
      setError('Network error — could not reach the server.');
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title flex items-center gap-2">
            <FiClock className="text-amber-500" /> Pending Results
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Patients who have been examined but are awaiting test results. Click &ldquo;Continue Visit&rdquo; when they return.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="btn-ghost border border-slate-200 rounded-lg text-xs"
            title="Refresh list"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          {!loading && !error && (
            <span className="text-sm font-bold bg-amber-100 text-amber-700 border border-amber-300 px-3 py-1 rounded-full">
              {drafts.length} Pending
            </span>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-300 rounded-xl px-4 py-3">
          <FiAlertTriangle className="text-red-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">Could not load pending visits</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
          <button onClick={load} className="text-xs text-red-700 underline hover:no-underline shrink-0">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400 gap-2">
          <FiLoader className="animate-spin text-xl" /> Loading pending visits…
        </div>
      ) : !error && drafts.length === 0 ? (
        <div className="card p-12 text-center space-y-3">
          <FiInbox className="text-5xl text-slate-300 mx-auto" />
          <p className="text-slate-500 font-semibold">No pending visits</p>
          <p className="text-xs text-slate-400">
            When a patient is examined and saved as a draft (awaiting test results), they will appear here.
          </p>
          <Link href="/consultation" className="btn-primary inline-flex mt-2">
            Start New Consultation
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map((d) => (
            <div key={d._id} className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Patient avatar */}
              <div className="w-11 h-11 rounded-full bg-amber-100 border-2 border-amber-300 text-amber-700 font-bold flex items-center justify-center text-lg shrink-0">
                {d.patientName.charAt(0)}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-slate-900">{d.patientName}</p>
                  <span className="font-mono text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                    {d.mrn}
                  </span>
                  <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-semibold">
                    ⏳ Awaiting Results
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-0.5">
                  Examined:{' '}
                  {new Date(d.visitDate).toLocaleDateString('en-PK', {
                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </p>

                {d.symptoms.length > 0 && (
                  <p className="text-xs text-slate-600 mt-1 truncate">
                    <span className="font-semibold">Complaints:</span> {d.symptoms.join(', ')}
                  </p>
                )}

                {d.testsPrescribed.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {d.testsPrescribed.map((t) => (
                      <span key={t} className="inline-flex items-center gap-1 text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full">
                        <FaFlask className="text-[9px]" /> {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action */}
              <Link
                href={`/consultation?visitId=${d._id}`}
                className="btn-primary shrink-0 whitespace-nowrap"
              >
                Continue Visit <FiArrowRight />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
