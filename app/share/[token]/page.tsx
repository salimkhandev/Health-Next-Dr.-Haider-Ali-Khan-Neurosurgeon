'use client';

import React, { useEffect, useState, use } from 'react';
import Image from 'next/image';
import { FaHeartbeat, FaAllergies, FaStethoscope, FaPaperclip, FaFilePdf } from 'react-icons/fa';
import { FiClock, FiFile } from 'react-icons/fi';

interface Patient {
  mrn: string;
  fullName: string;
  age: number;
  gender: string;
  contact: string;
  bloodGroup?: string;
  allergies: string[];
  chronicConditions: string[];
}

interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface Attachment {
  fileUrl: string;
  label: string;
  uploadedAt: string;
}

interface Visit {
  _id: string;
  visitDate: string;
  symptoms: string[];
  confirmedDiagnosis: string;
  testsPrescribed: string[];
  medicinesPrescribed: Medicine[];
  doctorNotes?: string;
  vitals?: { bp?: string; temperature?: number; pulse?: number; weight?: number };
  attachments?: Attachment[];
}

interface Settings {
  doctorName: string;
  specialization: string;
  qualifications: string;
  hospitalName: string;
  hospitalLogoUrl: string;
  contactDetails: string;
  specializationsList: string[];
}

export default function ShareLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/share-link/${token}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to load shared record.');
          setLoading(false);
          return;
        }
        setPatient(data.patient);
        setVisits(data.visits || []);
        setSettings(data.settings);
        setExpiresAt(data.expiresAt);
      } catch {
        setError('Error connecting to server.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <FaHeartbeat className="text-4xl text-blue-600 animate-pulse mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Loading shared medical record...</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 text-center shadow-lg space-y-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <h1 className="text-lg font-bold text-slate-800">Access Unavailable</h1>
          <p className="text-sm text-slate-500">{error || 'This link is invalid or has expired.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Expiry Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <FiClock className="text-amber-600 text-sm" />
            <span>Read-Only Referral Access — Valid until {new Date(expiresAt!).toLocaleString('en-GB')}</span>
          </div>
          <button
            onClick={() => window.print()}
            className="btn-secondary py-1 px-3 text-xs bg-white border-amber-300 text-amber-900 hover:bg-amber-100"
          >
            <FaFilePdf /> Print / Save PDF
          </button>
        </div>

        {/* Doctor Header & Letterhead */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-blue-600 shrink-0 bg-slate-100">
                <Image
                  src={settings?.hospitalLogoUrl || '/DR-IMAGE.png'}
                  alt={settings?.doctorName || 'Dr. Haider Ali Khan'}
                  fill
                  className="object-cover object-top"
                />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900">
                  {settings?.doctorName || 'Dr. Haider Ali Khan'}
                </h1>
                <p className="text-sm font-semibold text-blue-600">
                  {settings?.specialization || 'Neurosurgeon'}
                </p>
                <p className="text-xs text-slate-500 max-w-lg mt-0.5">
                  {settings?.qualifications}
                </p>
              </div>
            </div>
            <div className="text-center sm:text-right shrink-0">
              <span className="text-xs font-bold text-red-500 uppercase tracking-widest block">
                {settings?.hospitalName || 'Health Next'}
              </span>
              <p className="text-xs text-slate-400 mt-1">{settings?.contactDetails}</p>
            </div>
          </div>

          {/* Patient Info Banner */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                MRN: {patient.mrn}
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">{patient.fullName}</h2>
              <p className="text-xs text-slate-500">
                {patient.gender} · Age {patient.age} {patient.bloodGroup && `· Blood: ${patient.bloodGroup}`}
              </p>
            </div>
            {(patient.allergies?.length > 0 || patient.chronicConditions?.length > 0) && (
              <div className="space-y-1 text-right">
                {patient.allergies?.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-red-600 font-semibold justify-end">
                    <FaAllergies /> Allergies: {patient.allergies.join(', ')}
                  </div>
                )}
                {patient.chronicConditions?.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold justify-end">
                    <FaHeartbeat /> Chronic: {patient.chronicConditions.join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chronological Visits */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <FaStethoscope className="text-blue-600" /> Clinical Visit History
          </h3>

          {visits.length === 0 ? (
            <div className="bg-white rounded-xl p-8 border border-slate-200 text-center text-slate-500 text-sm">
              No visits found for this patient.
            </div>
          ) : (
            visits.map((v) => (
              <div key={v._id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-blue-700 font-mono">
                    Visit Date: {new Date(v.visitDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  {v.confirmedDiagnosis && (
                    <span className="text-xs font-bold bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full border border-purple-200">
                      Dx: {v.confirmedDiagnosis}
                    </span>
                  )}
                </div>

                {/* Vitals */}
                {v.vitals && (v.vitals.bp || v.vitals.pulse || v.vitals.temperature || v.vitals.weight) && (
                  <div className="flex flex-wrap gap-2 text-xs">
                    {v.vitals.bp && <span className="tag">BP: {v.vitals.bp}</span>}
                    {v.vitals.pulse && <span className="tag">Pulse: {v.vitals.pulse} bpm</span>}
                    {v.vitals.temperature && <span className="tag">Temp: {v.vitals.temperature}°C</span>}
                    {v.vitals.weight && <span className="tag">Weight: {v.vitals.weight} kg</span>}
                  </div>
                )}

                {/* Symptoms */}
                {v.symptoms?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Symptoms:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {v.symptoms.map((s, idx) => (
                        <span key={idx} className="tag-amber">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prescribed Medicines */}
                {v.medicinesPrescribed?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Prescribed Medicines:</span>
                    <div className="mt-1 space-y-1">
                      {v.medicinesPrescribed.map((m, idx) => (
                        <div key={idx} className="text-xs text-slate-700 font-medium">
                          • <span className="font-bold">{m.name}</span> — {m.dosage} ({m.frequency}, {m.duration})
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prescribed Tests */}
                {v.testsPrescribed?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Prescribed Tests:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {v.testsPrescribed.map((t, idx) => (
                        <span key={idx} className="tag-green">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Doctor Notes */}
                {v.doctorNotes && (
                  <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 border-l-2 border-blue-500">
                    <span className="font-bold text-slate-700 block mb-0.5">Doctor Clinical Notes:</span>
                    {v.doctorNotes}
                  </div>
                )}

                {/* Attachments */}
                {v.attachments && v.attachments.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1 mb-1">
                      <FaPaperclip /> Attached MRI Scans / Reports:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {v.attachments.map((a, idx) => (
                        <a
                          key={idx}
                          href={a.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-blue-50 text-blue-700"
                        >
                          <FiFile /> {a.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
