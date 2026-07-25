'use client';

import { useState } from 'react';
import { FiX, FiLoader, FiPlus } from 'react-icons/fi';
import { FaAllergies } from 'react-icons/fa';

interface Props {
  onClose: () => void;
  onCreated: (patient: Patient) => void;
}

export interface Patient {
  _id: string;
  mrn: string;
  fullName: string;
  age: number;
  dob?: string;
  gender: string;
  contact: string;
  address?: string;
  bloodGroup?: string;
  allergies: string[];
  chronicConditions: string[];
  visitCount: number;
  createdAt: string;
}

export default function RegisterPatientModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    fullName: '', age: '', dob: '', gender: 'Male', contact: '',
    address: '', bloodGroup: '', allergies: '', chronicConditions: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [duplicate, setDuplicate] = useState<Patient | null>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setDuplicate(null);
    setLoading(true);

    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          age: Number(form.age),
          dob: form.dob || undefined,
          gender: form.gender,
          contact: form.contact,
          address: form.address,
          bloodGroup: form.bloodGroup,
          allergies: form.allergies.split(',').map((s) => s.trim()).filter(Boolean),
          chronicConditions: form.chronicConditions.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();

      if (res.status === 409) {
        setDuplicate(data.existing as Patient);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError(data.error ?? 'Registration failed.');
        setLoading(false);
        return;
      }
      onCreated(data.patient as Patient);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-800">Register New Patient</h2>
            <p className="text-xs text-slate-500">MRN will be auto-generated</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Duplicate warning */}
        {duplicate && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <p className="font-semibold flex items-center gap-1.5">
              <FaAllergies className="text-amber-500" />
              Duplicate Patient Found
            </p>
            <p className="mt-1">
              <span className="font-mono font-bold">{duplicate.mrn}</span> — {duplicate.fullName} ({duplicate.contact})
            </p>
            <p className="text-xs mt-1 text-amber-600">
              A patient with this contact number already exists. Please search for them before registering.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 field-group">
              <label className="label">Full Name *</label>
              <input className="input" placeholder="e.g. Ahmed Khan" value={form.fullName}
                onChange={(e) => set('fullName', e.target.value)} required />
            </div>
            <div className="field-group">
              <label className="label">Age *</label>
              <input className="input" type="number" min={0} max={150} placeholder="e.g. 45"
                value={form.age} onChange={(e) => set('age', e.target.value)} required />
            </div>
            <div className="field-group">
              <label className="label">Date of Birth</label>
              <input className="input" type="date" value={form.dob}
                onChange={(e) => set('dob', e.target.value)} />
            </div>
            <div className="field-group">
              <label className="label">Gender *</label>
              <select className="input" value={form.gender} onChange={(e) => set('gender', e.target.value)} required>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div className="field-group">
              <label className="label">Blood Group</label>
              <select className="input" value={form.bloodGroup} onChange={(e) => set('bloodGroup', e.target.value)}>
                <option value="">— Select —</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 field-group">
              <label className="label">Contact Number *</label>
              <input className="input" placeholder="e.g. +92 300 1234567" value={form.contact}
                onChange={(e) => set('contact', e.target.value)} required />
            </div>
            <div className="col-span-2 field-group">
              <label className="label">Address</label>
              <input className="input" placeholder="Street, City" value={form.address}
                onChange={(e) => set('address', e.target.value)} />
            </div>
            <div className="col-span-2 field-group">
              <label className="label">Known Allergies</label>
              <input className="input" placeholder="Penicillin, Aspirin (comma-separated)" value={form.allergies}
                onChange={(e) => set('allergies', e.target.value)} />
            </div>
            <div className="col-span-2 field-group">
              <label className="label">Chronic Conditions</label>
              <input className="input" placeholder="Hypertension, Diabetes (comma-separated)" value={form.chronicConditions}
                onChange={(e) => set('chronicConditions', e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <><FiLoader className="animate-spin" /> Registering...</> : <><FiPlus /> Register Patient</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
