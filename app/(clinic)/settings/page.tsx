'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  FaUserMd, FaHospital, FaProcedures, FaPills, FaTrash,
} from 'react-icons/fa';
import { FiSave, FiPlus, FiLoader, FiCheck } from 'react-icons/fi';

interface Settings {
  doctorName: string;
  specialization: string;
  qualifications: string;
  registrationNumber: string;
  hospitalName: string;
  hospitalLogoUrl: string;
  contactDetails: string;
  specializationsList: string[];
}

interface MasterItem {
  _id: string;
  type: 'medicine' | 'test';
  name: string;
  defaultDosage?: string;
}

interface Ward {
  _id: string;
  wardName: string;
  bedCapacity: number;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'wards' | 'master'>('profile');

  // Profile form state
  const [settings, setSettings] = useState<Settings>({
    doctorName: 'Dr. Haider Ali Khan',
    specialization: 'Neurosurgeon',
    qualifications: 'MBBS, FCPS (Neurosurgery), Fellowship Endoscopic Neurosurgery, CHPE, Arab Spine Diploma',
    registrationNumber: 'PMC-12345-N',
    hospitalName: 'Health Next',
    hospitalLogoUrl: '/DR-IMAGE.png',
    contactDetails: 'Phone: +92 300 0000000 | Email: contact@healthnext.com',
    specializationsList: [
      'Brain & Spine Surgeries',
      'Brain Tumor Treatment',
      'Spinal Disorders (Slip Disc, Sciatica)',
      'Diagnosis & Treatment',
      'Hydrocephalus Treatment',
      'Numbness, Dizziness & Nerve Weakness',
    ],
  });
  const [newSpec, setNewSpec] = useState<string>('');
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Wards tab state
  const [wards, setWards] = useState<Ward[]>([]);
  const [newWardName, setNewWardName] = useState<string>('');
  const [newWardCapacity, setNewWardCapacity] = useState<number>(10);
  const [wardLoading, setWardLoading] = useState<boolean>(false);

  // Master list tab state
  const [masterType, setMasterType] = useState<'medicine' | 'test'>('medicine');
  const [masterQuery, setMasterQuery] = useState<string>('');
  const [masterItems, setMasterItems] = useState<MasterItem[]>([]);
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemDosage, setNewItemDosage] = useState<string>('');

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
    } catch {
      console.error('Failed loading settings');
    }
  }, []);

  const loadWards = useCallback(async () => {
    try {
      const res = await fetch('/api/wards');
      const data = await res.json();
      setWards(data.wards || []);
    } catch {
      console.error('Failed loading wards');
    }
  }, []);

  const loadMasterList = useCallback(async (type: string, q: string) => {
    try {
      const res = await fetch(`/api/master-list?type=${type}&q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setMasterItems(data.items || []);
    } catch {
      console.error('Failed loading master list');
    }
  }, []);

  useEffect(() => {
    loadSettings();
    loadWards();
  }, [loadSettings, loadWards]);

  useEffect(() => {
    if (activeTab === 'master') {
      loadMasterList(masterType, masterQuery);
    }
  }, [activeTab, masterType, masterQuery, loadMasterList]);

  // Save Settings
  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaveLoading(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } finally {
      setSaveLoading(false);
    }
  }

  // Add Specialization Tag
  function handleAddSpecialization() {
    if (!newSpec.trim()) return;
    if (!settings.specializationsList.includes(newSpec.trim())) {
      setSettings((s) => ({
        ...s,
        specializationsList: [...s.specializationsList, newSpec.trim()],
      }));
    }
    setNewSpec('');
  }

  // Remove Specialization Tag
  function handleRemoveSpecialization(spec: string) {
    setSettings((s) => ({
      ...s,
      specializationsList: s.specializationsList.filter((x) => x !== spec),
    }));
  }

  // Create Ward
  async function handleCreateWard(e: React.FormEvent) {
    e.preventDefault();
    if (!newWardName.trim()) return;
    setWardLoading(true);

    try {
      const res = await fetch('/api/wards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wardName: newWardName.trim(),
          bedCapacity: newWardCapacity,
        }),
      });

      if (res.ok) {
        setNewWardName('');
        setNewWardCapacity(10);
        loadWards();
      }
    } finally {
      setWardLoading(false);
    }
  }

  // Add Master Item
  async function handleAddMasterItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemName.trim()) return;

    try {
      const res = await fetch('/api/master-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: masterType,
          name: newItemName.trim(),
          defaultDosage: newItemDosage.trim(),
        }),
      });
      if (res.ok) {
        setNewItemName('');
        setNewItemDosage('');
        loadMasterList(masterType, masterQuery);
      }
    } catch {
      alert('Failed adding item to master list.');
    }
  }

  // Delete Master Item
  async function handleDeleteMasterItem(id: string) {
    if (!confirm('Are you sure you want to delete this master item?')) return;
    try {
      const res = await fetch(`/api/master-list?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadMasterList(masterType, masterQuery);
      }
    } catch {
      alert('Failed deleting item.');
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="section-title flex items-center gap-2">
          <FaHospital className="text-blue-600" /> Clinic &amp; Doctor Settings
        </h1>
        <p className="section-subtitle mt-0.5">
          Configure Dr. Haider Ali Khan letterhead, Health Next branding, wards, and master list
        </p>
      </div>

      {/* Tabs */}
      <div className="card p-1.5 sm:p-2 flex gap-1.5 sm:gap-2 border-b border-slate-200 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'profile'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FaUserMd /> Doctor &amp; Letterhead Profile
        </button>
        <button
          onClick={() => setActiveTab('wards')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'wards'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FaProcedures /> Wards &amp; Beds Config
        </button>
        <button
          onClick={() => setActiveTab('master')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'master'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FaPills /> Medicine &amp; Test Master List
        </button>
      </div>

      {/* TAB 1: DOCTOR & LETTERHEAD PROFILE */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveSettings} className="card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Letterhead Configuration
            </h2>
            {saveSuccess && (
              <span className="text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1">
                <FiCheck /> Settings Saved Successfully
              </span>
            )}
          </div>

          {/* Doctor Avatar / Photo Preview */}
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-blue-600 shrink-0 bg-slate-200 shadow-sm">
              <Image
                src={settings.hospitalLogoUrl || '/DR-IMAGE.png'}
                alt="Doctor Photo"
                fill
                className="object-cover object-top"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 text-sm">{settings.doctorName}</h3>
              <p className="text-xs text-blue-600 font-semibold">{settings.specialization}</p>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">{settings.qualifications}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="field-group">
              <label className="label">Doctor Name</label>
              <input
                className="input"
                value={settings.doctorName}
                onChange={(e) => setSettings({ ...settings, doctorName: e.target.value })}
                required
              />
            </div>

            <div className="field-group">
              <label className="label">Specialization / Title</label>
              <input
                className="input"
                value={settings.specialization}
                onChange={(e) => setSettings({ ...settings, specialization: e.target.value })}
                required
              />
            </div>

            <div className="sm:col-span-2 field-group">
              <label className="label">Full Qualifications String</label>
              <input
                className="input"
                value={settings.qualifications}
                onChange={(e) => setSettings({ ...settings, qualifications: e.target.value })}
                required
              />
            </div>

            <div className="field-group">
              <label className="label">Medical Registration Number</label>
              <input
                className="input"
                value={settings.registrationNumber}
                onChange={(e) => setSettings({ ...settings, registrationNumber: e.target.value })}
                required
              />
            </div>

            <div className="field-group">
              <label className="label">Hospital / Clinic Brand Name</label>
              <input
                className="input"
                value={settings.hospitalName}
                onChange={(e) => setSettings({ ...settings, hospitalName: e.target.value })}
                required
              />
            </div>

            <div className="field-group">
              <label className="label">Doctor Photo / Logo Asset URL</label>
              <input
                className="input"
                value={settings.hospitalLogoUrl}
                onChange={(e) => setSettings({ ...settings, hospitalLogoUrl: e.target.value })}
                required
              />
            </div>

            <div className="field-group">
              <label className="label">Contact Details</label>
              <input
                className="input"
                value={settings.contactDetails}
                onChange={(e) => setSettings({ ...settings, contactDetails: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Specializations List Editor */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="label">Specialization Tags (Featured on Prescriptions &amp; Dashboard)</label>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="e.g. Hydrocephalus Treatment, Spinal Surgeries..."
                value={newSpec}
                onChange={(e) => setNewSpec(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSpecialization())}
              />
              <button type="button" onClick={handleAddSpecialization} className="btn-secondary text-xs">
                <FiPlus /> Add Tag
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {settings.specializationsList.map((spec, i) => (
                <span
                  key={i}
                  className="bg-blue-50 text-blue-700 font-semibold text-xs px-3 py-1 rounded-full border border-blue-200 flex items-center gap-1.5"
                >
                  {spec}
                  <button
                    type="button"
                    onClick={() => handleRemoveSpecialization(spec)}
                    className="text-blue-400 hover:text-red-600 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button type="submit" disabled={saveLoading} className="btn-primary">
              {saveLoading ? <FiLoader className="animate-spin" /> : <FiSave />} Save Settings
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: WARDS & BEDS CONFIGURATION */}
      {activeTab === 'wards' && (
        <div className="space-y-6">
          {/* Add Ward Form */}
          <form onSubmit={handleCreateWard} className="card p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Add New Ward
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 field-group">
                <label className="label">Ward Name *</label>
                <input
                  className="input"
                  placeholder="e.g. Pediatric Neuro Ward"
                  value={newWardName}
                  onChange={(e) => setNewWardName(e.target.value)}
                  required
                />
              </div>
              <div className="field-group">
                <label className="label">Bed Capacity *</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={100}
                  value={newWardCapacity}
                  onChange={(e) => setNewWardCapacity(Number(e.target.value))}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={wardLoading || !newWardName.trim()} className="btn-primary text-xs">
                {wardLoading ? <FiLoader className="animate-spin" /> : <FiPlus />} Create Ward &amp; Generate Beds
              </button>
            </div>
          </form>

          {/* List of Wards */}
          <div className="card p-6 space-y-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Configured Wards ({wards.length})
            </h2>
            <div className="divide-y divide-slate-100">
              {wards.map((w) => (
                <div key={w._id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">{w.wardName}</span>
                    <span className="text-slate-500">Bed Capacity: {w.bedCapacity} beds</span>
                  </div>
                  <span className="badge-available">Configured</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MEDICINE & TEST MASTER LIST */}
      {activeTab === 'master' && (
        <div className="space-y-6">
          {/* Add Master Item Form */}
          <form onSubmit={handleAddMasterItem} className="card p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Add Item to Master Autocomplete List
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="field-group">
                <label className="label">Type</label>
                <select
                  className="input"
                  value={masterType}
                  onChange={(e) => setMasterType(e.target.value as 'medicine' | 'test')}
                >
                  <option value="medicine">Medicine</option>
                  <option value="test">Diagnostic Test</option>
                </select>
              </div>
              <div className="sm:col-span-2 field-group">
                <label className="label">Name *</label>
                <input
                  className="input"
                  placeholder={masterType === 'medicine' ? 'e.g. Levetiracetam' : 'e.g. MRI Brain'}
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  required
                />
              </div>
              <div className="field-group">
                <label className="label">Default Dosage (Optional)</label>
                <input
                  className="input"
                  placeholder="e.g. 500mg BD"
                  value={newItemDosage}
                  onChange={(e) => setNewItemDosage(e.target.value)}
                  disabled={masterType === 'test'}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={!newItemName.trim()} className="btn-primary text-xs">
                <FiPlus /> Add Master Item
              </button>
            </div>
          </form>

          {/* Master List Table */}
          <div className="card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMasterType('medicine')}
                  className={`px-3 py-1 rounded-md text-xs font-bold ${
                    masterType === 'medicine' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Medicines
                </button>
                <button
                  type="button"
                  onClick={() => setMasterType('test')}
                  className={`px-3 py-1 rounded-md text-xs font-bold ${
                    masterType === 'test' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Diagnostic Tests
                </button>
              </div>
              <input
                className="input text-xs w-full sm:w-64"
                placeholder="Search master items..."
                value={masterQuery}
                onChange={(e) => setMasterQuery(e.target.value)}
              />
            </div>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {masterItems.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">No items found.</p>
              ) : (
                masterItems.map((item) => (
                  <div key={item._id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{item.name}</span>
                      {item.defaultDosage && (
                        <span className="text-slate-400 ml-2">({item.defaultDosage})</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteMasterItem(item._id)}
                      className="text-red-400 hover:text-red-600 p-1"
                      title="Delete item"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
