'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import {
  FiLoader, FiSend, FiSave, FiX, FiPlus, FiAlertTriangle, FiInfo, FiUserCheck, FiPrinter, FiCheckCircle,
} from 'react-icons/fi';
import {
  FaUserInjured, FaRobot, FaHeartbeat, FaAllergies, FaStethoscope, FaFlask,
} from 'react-icons/fa';
import MasterListAutocomplete from '@/components/consultation/MasterListAutocomplete';
import PatientSearchAutocomplete from '@/components/consultation/PatientSearchAutocomplete';
import RegisterPatientModal, { type Patient } from '@/components/patients/RegisterPatientModal';

/* ---- Types ---- */
interface MasterItem { _id: string; type: 'medicine' | 'test'; name: string; defaultDosage?: string }
interface Medicine { name: string; dosage: string; frequency: string; duration: string }
interface Vitals { bp: string; temperature: string; pulse: string; weight: string }
interface AiSuggestion {
  possibleConditions: { name: string; reasoning: string }[];
  suggestedTests: string[];
  suggestedMedicines: { name: string; dosage: string }[];
  allergyConflicts: string[];
  clinicalNote?: string;
}
interface ChatMsg { role: 'user' | 'assistant'; message: string; timestamp: string }
interface GeminiMsg { role: 'user' | 'model'; parts: { text: string }[] }

const DISCLAIMER = '⚕ AI suggestions are decision-support tools only. All diagnoses, lab orders, and prescriptions must be evaluated and confirmed by the physician.';

function ConsultationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mrnFromUrl = searchParams?.get('mrn') ?? '';
  // visitId in URL = "complete visit" mode (continuing a draft)
  const visitIdFromUrl = searchParams?.get('visitId') ?? '';

  /* ---- Mode: 'new' = initial exam, 'complete' = finishing a draft ---- */
  const isCompleteMode = !!visitIdFromUrl;

  /* ---- Patient lookup state ---- */
  const [patient, setPatient] = useState<Patient | null>(null);
  const [patientLoading, setPatientLoading] = useState(false);
  const [patientError, setPatientError] = useState('');
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  /* ---- Visit form state ---- */
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState('');
  const [vitals, setVitals] = useState<Vitals>({ bp: '', temperature: '', pulse: '', weight: '' });
  const [followUpDate, setFollowUpDate] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [tests, setTests] = useState<string[]>([]);
  const [confirmedDiagnosis, setConfirmedDiagnosis] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');

  /* ---- AI state ---- */
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([]);
  const [geminiHistory, setGeminiHistory] = useState<GeminiMsg[]>([]);
  const [followUp, setFollowUp] = useState('');
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [saveAiChat, setSaveAiChat] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* ---- Save state ---- */
  const [saving, setSaving] = useState(false);
  const [savedVisitId, setSavedVisitId] = useState('');
  const [savedAsDraft, setSavedAsDraft] = useState(false);

  /* ---- Load recent patients ---- */
  useEffect(() => {
    async function loadRecent() {
      try {
        const res = await fetch('/api/patients?limit=5');
        const data = await res.json();
        setRecentPatients(data.patients || []);
      } catch { console.error('Failed loading recent patients'); }
    }
    loadRecent();
  }, []);

  /* ---- Fetch patient by MRN (from URL param) ---- */
  const fetchPatientByMrn = useCallback(async (mrn: string) => {
    setPatientError('');
    setPatientLoading(true);
    try {
      const res = await fetch(`/api/patients/${mrn.trim().toUpperCase()}`);
      if (!res.ok) { setPatientError('Patient not found.'); setPatient(null); return; }
      const data = await res.json();
      setPatient(data.patient);
    } finally { setPatientLoading(false); }
  }, []);

  useEffect(() => {
    if (mrnFromUrl) fetchPatientByMrn(mrnFromUrl);
  }, [mrnFromUrl, fetchPatientByMrn]);

  /* ---- Load existing draft visit when in complete mode ---- */
  useEffect(() => {
    if (!visitIdFromUrl) return;
    async function loadDraft() {
      setPatientLoading(true);
      try {
        const res = await fetch(`/api/visits/${visitIdFromUrl}`);
        if (!res.ok) return;
        const data = await res.json();
        const v = data.visit;
        // Pre-populate all fields from the saved draft
        setSymptoms(v.symptoms ?? []);
        setTests(v.testsPrescribed ?? []);
        setMedicines(v.medicinesPrescribed ?? []);
        setDoctorNotes(v.doctorNotes ?? '');
        setConfirmedDiagnosis(v.confirmedDiagnosis ?? '');
        if (v.nextFollowUpDate) setFollowUpDate(v.nextFollowUpDate.split('T')[0]);
        if (v.vitals) {
          setVitals({
            bp: v.vitals.bp ?? '',
            temperature: v.vitals.temperature?.toString() ?? '',
            pulse: v.vitals.pulse?.toString() ?? '',
            weight: v.vitals.weight?.toString() ?? '',
          });
        }
        // Load patient record from the draft's MRN
        await fetchPatientByMrn(v.mrn);
      } finally { setPatientLoading(false); }
    }
    loadDraft();
  }, [visitIdFromUrl, fetchPatientByMrn]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  /* ---- Symptom helpers ---- */
  function addSymptom() {
    const s = symptomInput.trim();
    if (s && !symptoms.includes(s)) setSymptoms((prev) => [...prev, s]);
    setSymptomInput('');
  }
  function removeSymptom(s: string) { setSymptoms((prev) => prev.filter((x) => x !== s)); }

  /* ---- AI initial suggestion ---- */
  async function getAiSuggestions() {
    if (!patient || symptoms.length === 0) return;
    setAiLoading(true);
    setAiError('');
    setAiSuggestions(null);
    setChatHistory([]);
    setGeminiHistory([]);
    try {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms,
          patient: {
            mrn: patient.mrn, fullName: patient.fullName,
            age: patient.age, gender: patient.gender,
            allergies: patient.allergies || [], chronicConditions: patient.chronicConditions || [],
          },
          conversationHistory: [],
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setAiError(data.error ?? 'AI unavailable'); return; }
      if (data.type === 'initial' && data.suggestions) {
        setAiSuggestions(data.suggestions);
        const userTurn = `Symptoms: ${symptoms.join(', ')}`;
        setGeminiHistory([
          { role: 'user', parts: [{ text: userTurn }] },
          { role: 'model', parts: [{ text: data.rawText }] },
        ]);
        setChatHistory([{ role: 'assistant', message: '✅ AI analysis complete. See suggestions below.', timestamp: new Date().toISOString() }]);
      } else if (data.rawText) {
        setChatHistory([{ role: 'assistant', message: data.rawText, timestamp: new Date().toISOString() }]);
      }
    } catch { setAiError('AI assistant unavailable. You can still save the visit manually.'); }
    finally { setAiLoading(false); }
  }

  /* ---- AI follow-up ---- */
  async function sendFollowUp() {
    const msg = followUp.trim();
    if (!msg || !patient) return;
    setFollowUp('');
    setFollowUpLoading(true);
    setChatHistory((prev) => [...prev, { role: 'user', message: msg, timestamp: new Date().toISOString() }]);
    try {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms, patient: { mrn: patient.mrn, fullName: patient.fullName, age: patient.age, gender: patient.gender, allergies: patient.allergies || [], chronicConditions: patient.chronicConditions || [] },
          conversationHistory: geminiHistory, followUpMessage: msg,
        }),
      });
      const data = await res.json();
      const reply = data.rawText ?? 'No response.';
      setChatHistory((prev) => [...prev, { role: 'assistant', message: reply, timestamp: new Date().toISOString() }]);
      setGeminiHistory((prev) => [...prev, { role: 'user', parts: [{ text: msg }] }, { role: 'model', parts: [{ text: reply }] }]);
    } catch {
      setChatHistory((prev) => [...prev, { role: 'assistant', message: 'AI unavailable.', timestamp: new Date().toISOString() }]);
    } finally { setFollowUpLoading(false); }
  }

  /* ---- Medicine helpers ---- */
  function addMedicine(item: { name: string; defaultDosage?: string }) {
    setMedicines((prev) => [...prev, { name: item.name, dosage: item.defaultDosage ?? '', frequency: '', duration: '' }]);
  }
  function updateMedicine(i: number, field: keyof Medicine, value: string) {
    setMedicines((prev) => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  }
  function removeMedicine(i: number) { setMedicines((prev) => prev.filter((_, idx) => idx !== i)); }

  /* ---- Test helpers ---- */
  function addTest(item: MasterItem) {
    if (!tests.includes(item.name)) setTests((prev) => [...prev, item.name]);
  }
  function removeTest(t: string) { setTests((prev) => prev.filter((x) => x !== t)); }

  /* ---- Allergy conflict check ---- */
  const allergyConflicts = aiSuggestions?.allergyConflicts?.filter(
    (c) => patient?.allergies?.some((a) => a.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(a.toLowerCase()))
  ) ?? [];

  /* ---- Build visit payload ---- */
  function buildPayload(status: 'draft' | 'complete') {
    return {
      mrn: patient!.mrn,
      status,
      symptoms,
      confirmedDiagnosis,
      testsPrescribed: tests,
      medicinesPrescribed: medicines,
      doctorNotes,
      vitals: {
        bp: vitals.bp || undefined,
        temperature: vitals.temperature ? Number(vitals.temperature) : undefined,
        pulse: vitals.pulse ? Number(vitals.pulse) : undefined,
        weight: vitals.weight ? Number(vitals.weight) : undefined,
      },
      aiConversation: saveAiChat ? chatHistory.map((m) => ({ role: m.role, message: m.message, timestamp: m.timestamp })) : [],
      aiSuggestions: aiSuggestions ?? {},
      nextFollowUpDate: followUpDate || undefined,
    };
  }

  /* ---- Save as Draft (Phase 1) ---- */
  async function saveDraft() {
    if (!patient) return;
    setSaving(true);
    try {
      const res = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload('draft')),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? 'Save failed.'); return; }
      setSavedVisitId(data.visit._id);
      setSavedAsDraft(true);
    } finally { setSaving(false); }
  }

  /* ---- Complete visit (Phase 2 — called from both new and continue-draft modes) ---- */
  async function completeVisit() {
    if (!patient || !confirmedDiagnosis.trim()) {
      alert('Please enter a confirmed diagnosis before completing the visit.');
      return;
    }
    setSaving(true);
    try {
      if (isCompleteMode) {
        // PATCH the existing draft to complete it
        const res = await fetch(`/api/visits/${visitIdFromUrl}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...buildPayload('complete'), status: 'complete' }),
        });
        const data = await res.json();
        if (!res.ok) { alert(data.error ?? 'Save failed.'); return; }
        setSavedVisitId(visitIdFromUrl);
        setSavedAsDraft(false);
      } else {
        // Create a brand-new complete visit (doctor filled everything in one go)
        const res = await fetch('/api/visits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildPayload('complete')),
        });
        const data = await res.json();
        if (!res.ok) { alert(data.error ?? 'Save failed.'); return; }
        setSavedVisitId(data.visit._id);
        setSavedAsDraft(false);
      }
    } finally { setSaving(false); }
  }

  /* ---- Print test requisition slip ---- */
  function printTestSlip() { window.print(); }

  /* ---- Saved success screen ---- */
  if (savedVisitId) {
    return (
      <div className="max-w-lg mx-auto mt-20 card p-8 text-center space-y-4">
        <div className="text-5xl">{savedAsDraft ? '📋' : '✅'}</div>
        <h2 className="text-xl font-bold text-slate-800">
          {savedAsDraft ? 'Draft Saved — Awaiting Test Results' : 'Visit Completed'}
        </h2>
        <p className="text-slate-500 text-sm">
          {savedAsDraft
            ? `Exam saved for ${patient?.fullName}. When results arrive, find this visit in the Pending Results tab to continue.`
            : `Consultation record finalized for ${patient?.fullName}.`}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
          {savedAsDraft ? (
            <>
              <button onClick={printTestSlip} className="btn-secondary justify-center">
                <FiPrinter /> Print Test Requisition
              </button>
              <Link href="/pending" className="btn-primary justify-center">
                View Pending Results
              </Link>
            </>
          ) : (
            <>
              <Link href={`/prescription/${savedVisitId}`} className="btn-primary justify-center">
                <FiPrinter /> Print Prescription
              </Link>
              <Link href={`/patients/${patient?.mrn}`} className="btn-secondary justify-center">
                View Patient Profile
              </Link>
            </>
          )}
          <button onClick={() => {
            setSavedVisitId(''); setPatient(null); setSymptoms([]); setMedicines([]);
            setTests([]); setConfirmedDiagnosis(''); setDoctorNotes(''); setAiSuggestions(null); setChatHistory([]);
          }} className="btn-ghost border border-slate-200 rounded-lg justify-center">
            New Consultation
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ===== TEST REQUISITION SLIP (print-only) ===== */}
      <div className="hidden print:block p-8 max-w-2xl mx-auto font-sans">
        <div className="text-center border-b-2 border-slate-800 pb-3 mb-4">
          <h1 className="text-xl font-bold">Health Next — Test Requisition</h1>
          <p className="text-sm text-slate-600">Dr. Haider Ali Khan — Neurosurgery</p>
          <p className="text-xs text-slate-500">Date: {new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
        {patient && (
          <div className="mb-4 text-sm space-y-1">
            <p><strong>Patient:</strong> {patient.fullName}</p>
            <p><strong>MRN:</strong> {patient.mrn} &nbsp;|&nbsp; <strong>Age/Gender:</strong> {patient.age} / {patient.gender}</p>
            {patient.contact && <p><strong>Contact:</strong> {patient.contact}</p>}
            {symptoms.length > 0 && <p><strong>Presenting Complaints:</strong> {symptoms.join(', ')}</p>}
          </div>
        )}
        {tests.length > 0 && (
          <div className="mb-4">
            <p className="font-bold text-sm mb-2 uppercase tracking-wide">Tests Ordered:</p>
            <ul className="space-y-1.5">
              {tests.map((t) => (
                <li key={t} className="flex items-center gap-2 text-sm">
                  <span className="w-4 h-4 border border-slate-400 inline-block shrink-0 rounded-sm" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-xs text-slate-400 border-t pt-2 mt-6 italic">
          Please bring this slip and all test reports on your next visit. — Health Next
        </p>
      </div>

      {/* ===== MAIN CONSULTATION UI (screen only) ===== */}
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-5 print:hidden">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <h1 className="section-title flex items-center gap-2">
            <FaStethoscope className="text-blue-500" />
            {isCompleteMode ? 'Complete Visit — Add Results' : 'New Consultation'}
          </h1>
          {/* Phase badge */}
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
            isCompleteMode
              ? 'bg-amber-50 text-amber-700 border-amber-300'
              : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            {isCompleteMode ? '📋 Phase 2 — Completing Draft' : '🩺 Phase 1 — Initial Exam'}
          </span>
        </div>

        {/* Mode explanation banner */}
        <div className={`flex items-start gap-2 text-xs rounded-xl px-4 py-3 ${
          isCompleteMode
            ? 'bg-amber-50 border border-amber-200 text-amber-800'
            : 'bg-blue-50 border border-blue-200 text-blue-700'
        }`}>
          <FiInfo className="shrink-0 mt-0.5" />
          <p className="leading-snug">
            {isCompleteMode
              ? 'You are completing a previously saved draft. Add the confirmed diagnosis, medicines, and follow-up date based on test results, then click "Complete & Save Visit".'
              : 'Phase 1: Record symptoms, vitals, and order tests. Save as Draft — the patient can take the Test Requisition to the lab. When they return with results, go to Pending Results to complete the visit.'}
          </p>
        </div>

        {/* AI disclaimer */}
        <div className="flex items-start gap-2 text-[11px] sm:text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-3 sm:px-4 py-2.5">
          <FiInfo className="shrink-0 mt-0.5 text-blue-500" />
          <p className="leading-snug">{DISCLAIMER}</p>
        </div>

        {/* STEP 1 — PATIENT SEARCH */}
        <div className="card p-4 sm:p-5 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <FaUserInjured className="text-blue-500" />
              <span className="hidden sm:inline">Step 1 — Select Patient</span>
              <span className="sm:hidden">Select Patient</span>
            </h2>
            {!patient && !isCompleteMode && (
              <button onClick={() => setShowRegisterModal(true)} className="btn-secondary">
                <FiPlus />
                <span className="hidden sm:inline">Register New Patient</span>
                <span className="sm:hidden">Register</span>
              </button>
            )}
          </div>

          {patientLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-3">
              <FiLoader className="animate-spin" /> Loading patient…
            </div>
          ) : !patient ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <PatientSearchAutocomplete onSelectPatient={(p) => setPatient(p)} />
              </div>
              {recentPatients.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
                    Recent Patients (1-Click):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {recentPatients.map((p) => (
                      <button
                        key={p.mrn}
                        type="button"
                        onClick={() => setPatient(p)}
                        className="inline-flex items-center gap-1.5 text-xs bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-800 font-semibold px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
                      >
                        <FiUserCheck className="text-blue-500" />
                        <span>{p.fullName}</span>
                        <span className="font-mono text-[10px] text-blue-700">({p.mrn})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-blue-50/60 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-lg shadow-xs">
                  {patient.fullName.charAt(0)}
                </div>
                <div>
                  <p className="font-extrabold text-slate-900 text-base">{patient.fullName}</p>
                  <p className="text-xs text-slate-600">
                    <span className="font-mono font-bold text-blue-700">{patient.mrn}</span> · {patient.gender}, Age {patient.age}
                    {patient.contact ? ` · ${patient.contact}` : ''}
                  </p>
                  {patient.allergies && patient.allergies.length > 0 && (
                    <p className="text-xs text-red-600 font-bold mt-0.5 flex items-center gap-1">
                      <FaAllergies /> Allergies: {patient.allergies.join(', ')}
                    </p>
                  )}
                </div>
              </div>
              {!isCompleteMode && (
                <button onClick={() => setPatient(null)} className="btn-ghost text-xs border border-slate-200 hover:bg-white">
                  <FiX /> Change
                </button>
              )}
            </div>
          )}
          {patientError && <p className="text-sm text-red-600">{patientError}</p>}
        </div>

        {patient && (
          <>
            {/* Step 2 — Vitals */}
            <div className="card p-5">
              <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <FaHeartbeat className="text-red-400" /> Step 2 — Vitals (Optional)
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(['bp', 'temperature', 'pulse', 'weight'] as const).map((key) => (
                  <div key={key} className="field-group">
                    <label className="label">{key === 'bp' ? 'Blood Pressure' : key.charAt(0).toUpperCase() + key.slice(1)}</label>
                    <input
                      className="input"
                      placeholder={key === 'bp' ? '120/80' : key === 'temperature' ? '37.0°C' : key === 'pulse' ? '72 bpm' : '70 kg'}
                      value={vitals[key]}
                      onChange={(e) => setVitals((v) => ({ ...v, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3 — Symptoms + AI */}
            <div className="card p-5">
              <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <FaRobot className="text-purple-500" /> Step 3 — Symptoms &amp; AI Assistant
              </h2>

              <div className="mb-3">
                <label className="label">Presenting Symptoms</label>
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    placeholder="Type a symptom and press Enter or Add"
                    value={symptomInput}
                    onChange={(e) => setSymptomInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSymptom())}
                  />
                  <button type="button" onClick={addSymptom} className="btn-secondary">
                    <FiPlus /> Add
                  </button>
                </div>
                {symptoms.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {symptoms.map((s) => (
                      <span key={s} className="tag-amber flex items-center gap-1">
                        {s}
                        <button onClick={() => removeSymptom(s)} className="ml-0.5 hover:text-red-600">
                          <FiX className="text-xs" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={getAiSuggestions} disabled={aiLoading || symptoms.length === 0} className="btn-primary mb-4">
                {aiLoading ? <><FiLoader className="animate-spin" /> Consulting AI…</> : <><FaRobot /> Get AI Suggestions</>}
              </button>
              {aiError && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
                  <FiAlertTriangle /> {aiError}
                </p>
              )}

              {/* Allergy conflict warning */}
              {allergyConflicts.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-xl flex items-start gap-2">
                  <FaAllergies className="text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-red-700">⚠ Allergy Conflict Detected</p>
                    <p className="text-xs text-red-600 mt-0.5">
                      AI suggested medicine(s) conflicting with patient allergies: <strong>{allergyConflicts.join(', ')}</strong>. Do NOT select without clinical review.
                    </p>
                  </div>
                </div>
              )}

              {/* AI Suggestions panel */}
              {aiSuggestions && (
                <div className="space-y-4 mb-4 p-4 bg-purple-50/50 border border-purple-200 rounded-xl">
                  {aiSuggestions.possibleConditions?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase text-purple-600 tracking-wider mb-2">Suggested Differential Diagnoses</p>
                      <div className="space-y-2">
                        {aiSuggestions.possibleConditions.map((c, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <button
                              type="button"
                              onClick={() => setConfirmedDiagnosis(c.name)}
                              className="shrink-0 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold px-2 py-0.5 rounded border border-purple-200 transition-colors"
                              title="Use as confirmed diagnosis"
                            >
                              Use
                            </button>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                              <p className="text-xs text-slate-500">{c.reasoning}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {aiSuggestions.suggestedTests?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase text-purple-600 tracking-wider mb-2">Suggested Tests</p>
                      <div className="flex flex-wrap gap-2">
                        {aiSuggestions.suggestedTests.map((t, i) => {
                          const isAdded = tests.includes(t);
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => isAdded ? removeTest(t) : setTests((prev) => [...prev, t])}
                              className={`tag-green hover:bg-emerald-100 cursor-pointer transition-all ${isAdded ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700' : ''}`}
                            >
                              {isAdded ? '✓' : <FiPlus className="text-xs" />} {t}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {aiSuggestions.suggestedMedicines?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase text-purple-600 tracking-wider mb-2">Suggested Medicines</p>
                      <div className="flex flex-wrap gap-2">
                        {aiSuggestions.suggestedMedicines.map((m, i) => {
                          const hasConflict = allergyConflicts.some((c) =>
                            m.name.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(m.name.toLowerCase())
                          );
                          const isAdded = medicines.some((x) => x.name === m.name);
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => isAdded
                                ? setMedicines((prev) => prev.filter((x) => x.name !== m.name))
                                : setMedicines((prev) => [...prev, { name: m.name, dosage: m.dosage, frequency: '', duration: '' }])
                              }
                              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                                isAdded ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                                  : hasConflict ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                                  : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                              }`}
                              title={isAdded ? 'Remove' : hasConflict ? '⚠ Allergy conflict' : 'Add'}
                            >
                              {isAdded ? '✓ ' : hasConflict ? '⚠ ' : <FiPlus className="text-xs" />} {m.name} {m.dosage && `(${m.dosage})`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {aiSuggestions.clinicalNote && (
                    <p className="text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2 italic">
                      🩺 {aiSuggestions.clinicalNote}
                    </p>
                  )}

                  <div className="flex items-start gap-2 pt-3 border-t border-purple-200/70 text-[11px] text-purple-800 bg-purple-100/60 p-2.5 rounded-lg font-medium">
                    <FiAlertTriangle className="text-purple-600 mt-0.5 shrink-0 text-sm" />
                    <p className="leading-tight">
                      <strong>Clinical Disclaimer:</strong> AI outputs are decision-support only. The treating doctor holds full clinical responsibility.
                    </p>
                  </div>
                </div>
              )}

              {/* AI Follow-up chat */}
              {chatHistory.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                    <p className="text-xs font-bold text-slate-600">AI Follow-up Conversation</p>
                  </div>
                  <div className="max-h-48 overflow-y-auto p-3 space-y-2">
                    {chatHistory.map((m, i) => (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] text-xs px-3 py-2 rounded-xl ${
                          m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-700 rounded-bl-none'
                        }`}>
                          {m.role === 'assistant' ? (
                            <ReactMarkdown components={{
                              p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-snug">{children}</p>,
                              strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>,
                              ul: ({ children }) => <ul className="list-disc pl-4 space-y-0.5 my-1">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal pl-4 space-y-0.5 my-1">{children}</ol>,
                              li: ({ children }) => <li className="leading-snug">{children}</li>,
                              hr: () => <hr className="my-2 border-slate-300" />,
                              code: ({ children }) => <code className="bg-slate-200 text-slate-800 text-[10px] px-1 py-0.5 rounded font-mono">{children}</code>,
                            }}>
                              {m.message}
                            </ReactMarkdown>
                          ) : m.message}
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="px-3 py-2 border-t border-slate-200 flex gap-2">
                    <input
                      className="input flex-1 text-xs py-1.5"
                      placeholder="Ask a follow-up question…"
                      value={followUp}
                      onChange={(e) => setFollowUp(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendFollowUp()}
                    />
                    <button onClick={sendFollowUp} disabled={followUpLoading || !followUp.trim()} className="btn-primary py-1.5 px-3 text-xs">
                      {followUpLoading ? <FiLoader className="animate-spin" /> : <FiSend />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Step 4 — Tests Ordered */}
            <div className="card p-5">
              <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <FaFlask className="text-teal-500" /> Step 4 — Tests Ordered
              </h2>
              <MasterListAutocomplete type="test" placeholder="Search or add test…" onSelect={addTest} />
              {tests.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {tests.map((t) => (
                    <span key={t} className="tag-green flex items-center gap-1">
                      {t}
                      <button onClick={() => removeTest(t)}><FiX className="text-xs" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Step 5 — Prescribed Medicines (always visible, but labelled optional in Phase 1) */}
            <div className="card p-5">
              <h2 className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                Step 5 — Prescribed Medicines
                {!isCompleteMode && <span className="text-xs font-normal text-slate-400">(Optional — add now or after test results)</span>}
              </h2>
              <MasterListAutocomplete type="medicine" placeholder="Search or add medicine…" onSelect={(item) => addMedicine(item)} />
              {medicines.length > 0 && (
                <div className="mt-3 space-y-2">
                  {medicines.map((m, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-sm font-semibold text-slate-800 min-w-[120px]">{m.name}</span>
                      <input className="input text-xs py-1 flex-1 min-w-[80px]" placeholder="Dosage" value={m.dosage} list="dosage-suggestions" onChange={(e) => updateMedicine(i, 'dosage', e.target.value)} />
                      <input className="input text-xs py-1 flex-1 min-w-[80px]" placeholder="Frequency" value={m.frequency} list="frequency-suggestions" onChange={(e) => updateMedicine(i, 'frequency', e.target.value)} />
                      <input className="input text-xs py-1 flex-1 min-w-[80px]" placeholder="Duration" value={m.duration} list="duration-suggestions" onChange={(e) => updateMedicine(i, 'duration', e.target.value)} />
                      <button onClick={() => removeMedicine(i)} className="text-red-400 hover:text-red-600 p-1"><FiX /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 6 — Diagnosis & Completion (Phase 2 focus) */}
            <div className={`card p-5 space-y-4 ${isCompleteMode ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}>
              <h2 className="text-sm font-bold text-slate-700">
                Step 6 —{' '}
                {isCompleteMode ? 'Confirmed Diagnosis & Final Notes' : 'Diagnosis / Notes (Optional for Draft)'}
              </h2>

              <div className="field-group">
                <label className="label">
                  {isCompleteMode ? 'Confirmed Diagnosis *' : 'Provisional Diagnosis (Optional — fill after tests)'}
                </label>
                <input
                  className="input"
                  placeholder={isCompleteMode ? 'Enter confirmed diagnosis based on test results' : 'Leave blank to save as draft, or enter provisional diagnosis'}
                  value={confirmedDiagnosis}
                  onChange={(e) => setConfirmedDiagnosis(e.target.value)}
                />
                {!isCompleteMode && (
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    You can leave this blank and complete it later via the Pending Results tab when test results arrive.
                  </p>
                )}
              </div>

              <div className="field-group">
                <label className="label">Doctor&apos;s Notes (Optional)</label>
                <textarea
                  className="input min-h-[70px] resize-y"
                  placeholder="Clinical notes, observations, patient instructions…"
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                />
              </div>

              <div className="field-group">
                <label className="label">Next Follow-up Date (Optional)</label>
                <input
                  className="input"
                  type="date"
                  value={followUpDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={saveAiChat} onChange={(e) => setSaveAiChat(e.target.checked)} className="w-4 h-4 accent-blue-600" />
                <span className="text-xs text-slate-600">Save AI conversation alongside this visit (for audit/reference)</span>
              </label>

              {/* Action buttons */}
              <div className="flex flex-wrap justify-between gap-3 pt-2 border-t border-slate-100">
                {/* Left: Test Requisition print (always available) */}
                <button
                  type="button"
                  onClick={printTestSlip}
                  disabled={tests.length === 0}
                  className="btn-secondary disabled:opacity-40"
                  title={tests.length === 0 ? 'Add at least one test to print the slip' : 'Print test requisition slip for patient'}
                >
                  <FiPrinter /> Print Test Slip
                </button>

                {/* Right: Save buttons */}
                <div className="flex gap-3">
                  <Link href={patient ? `/patients/${patient.mrn}` : '/patients'} className="btn-ghost border border-slate-200 rounded-lg">
                    Cancel
                  </Link>

                  {/* Phase 1 only: Save as Draft */}
                  {!isCompleteMode && (
                    <button
                      onClick={saveDraft}
                      disabled={saving || symptoms.length === 0}
                      className="btn-secondary disabled:opacity-40"
                      title="Save exam now — complete diagnosis after test results"
                    >
                      {saving ? <><FiLoader className="animate-spin" /> Saving…</> : <><FiSave /> Save as Draft</>}
                    </button>
                  )}

                  {/* Complete visit button (Phase 1 optional shortcut + Phase 2 primary) */}
                  <button
                    onClick={completeVisit}
                    disabled={saving || !confirmedDiagnosis.trim()}
                    className="btn-primary disabled:opacity-40"
                    title={!confirmedDiagnosis.trim() ? 'Enter a confirmed diagnosis to complete the visit' : ''}
                  >
                    {saving
                      ? <><FiLoader className="animate-spin" /> Saving…</>
                      : <><FiCheckCircle /> {isCompleteMode ? 'Complete & Save Visit' : 'Save as Complete'}</>
                    }
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Register new patient modal */}
        {showRegisterModal && (
          <RegisterPatientModal
            onClose={() => setShowRegisterModal(false)}
            onCreated={(newPatient) => { setShowRegisterModal(false); setPatient(newPatient); }}
          />
        )}

        {/* Datalist autocomplete suggestions */}
        <datalist id="dosage-suggestions">
          <option value="500 mg" /><option value="250 mg" /><option value="100 mg" />
          <option value="50 mg" /><option value="20 mg" /><option value="10 mg" />
          <option value="5 mg" /><option value="1 Tab" /><option value="1 Cap" /><option value="1 tsp" />
        </datalist>
        <datalist id="frequency-suggestions">
          <option value="1-0-1" /><option value="1-1-1" /><option value="1-0-0" />
          <option value="0-0-1" /><option value="OD (Once daily)" /><option value="BD (Twice daily)" />
          <option value="TDS (Thrice daily)" /><option value="QDS (Four times daily)" /><option value="PRN (As needed)" />
        </datalist>
        <datalist id="duration-suggestions">
          <option value="5 Days" /><option value="7 Days" /><option value="10 Days" />
          <option value="2 Weeks" /><option value="1 Month" /><option value="2 Months" /><option value="3 Months" />
        </datalist>
      </div>
    </>
  );
}

export default function ConsultationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><FiLoader className="animate-spin text-blue-400 text-2xl" /></div>}>
      <ConsultationContent />
    </Suspense>
  );
}
