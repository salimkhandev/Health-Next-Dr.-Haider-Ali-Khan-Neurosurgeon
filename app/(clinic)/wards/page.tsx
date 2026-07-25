'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FaProcedures, FaUserInjured, FaUserMd, FaHeartbeat, FaCheckCircle, FaExclamationTriangle,
} from 'react-icons/fa';
import { FiPlus, FiLoader, FiX, FiSearch, FiRefreshCw, FiLogOut } from 'react-icons/fi';

interface Ward {
  _id: string;
  wardName: string;
  bedCapacity: number;
  totalBeds: number;
  occupiedCount: number;
  availableCount: number;
  maintenanceCount: number;
  occupancyRate: number;
}

interface Patient {
  mrn: string;
  fullName: string;
  age: number;
  gender: string;
  contact: string;
}

interface Admission {
  _id: string;
  mrn: string;
  wardId: string;
  bedId: string;
  admissionDate: string;
  admittingDiagnosis: string;
  attendingDoctor: string;
  status: string;
}

interface BedItem {
  _id: string;
  wardId: string;
  bedNumber: string;
  status: 'Available' | 'Occupied' | 'Under Maintenance';
  currentAdmissionId?: string;
  admission?: Admission;
  patient?: Patient;
}

export default function WardManagementPage() {
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedWardId, setSelectedWardId] = useState<string>('ALL');
  const [beds, setBeds] = useState<BedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [admitModalOpen, setAdmitModalOpen] = useState<boolean>(false);
  const [selectedBedForAdmit, setSelectedBedForAdmit] = useState<BedItem | null>(null);

  const [dischargeModalOpen, setDischargeModalOpen] = useState<boolean>(false);
  const [selectedBedForDischarge, setSelectedBedForDischarge] = useState<BedItem | null>(null);
  const [dischargeNotes, setDischargeNotes] = useState<string>('');

  // Admit form state
  const [admitMrn, setAdmitMrn] = useState<string>('');
  const [admitDiagnosis, setAdmitDiagnosis] = useState<string>('');
  const [admitDoctor, setAdmitDoctor] = useState<string>('Dr. Haider Ali Khan');
  const [admitLoading, setAdmitLoading] = useState<boolean>(false);
  const [admitError, setAdmitError] = useState<string>('');
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null);
  const [searchingPatient, setSearchingPatient] = useState<boolean>(false);

  // Suggested recent/today's patients
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [loadingRecent, setLoadingRecent] = useState<boolean>(false);

  // Fetch recent patients when admit modal opens
  useEffect(() => {
    if (admitModalOpen) {
      setLoadingRecent(true);
      fetch('/api/patients?limit=12')
        .then((res) => res.json())
        .then((data) => {
          setRecentPatients(data.patients || []);
        })
        .catch(() => {})
        .finally(() => setLoadingRecent(false));
    }
  }, [admitModalOpen]);

  // One-click select suggested patient
  async function selectSuggestedPatient(p: Patient) {
    setAdmitMrn(p.mrn);
    setFoundPatient(p);
    setAdmitError('');
    try {
      const res = await fetch(`/api/visits?mrn=${p.mrn}`);
      const data = await res.json();
      if (data.visits && data.visits.length > 0) {
        const latestDx = data.visits[0].confirmedDiagnosis;
        if (latestDx && !admitDiagnosis) {
          setAdmitDiagnosis(latestDx);
        }
      }
    } catch {}
  }

  const loadWardData = useCallback(async () => {
    setLoading(true);
    try {
      const [wardsRes, bedsRes] = await Promise.all([
        fetch('/api/wards'),
        fetch(`/api/beds${selectedWardId !== 'ALL' ? `?wardId=${selectedWardId}` : ''}`),
      ]);
      const wardsData = await wardsRes.json();
      const bedsData = await bedsRes.json();

      setWards(wardsData.wards || []);
      setBeds(bedsData.beds || []);
    } catch {
      console.error('Failed loading ward data');
    } finally {
      setLoading(false);
    }
  }, [selectedWardId]);

  useEffect(() => {
    loadWardData();
  }, [loadWardData]);

  // Lookup patient by MRN during admission
  async function handleLookupPatient(mrnToFind: string) {
    if (!mrnToFind.trim()) return;
    setSearchingPatient(true);
    setAdmitError('');
    try {
      const res = await fetch(`/api/patients/${mrnToFind.trim().toUpperCase()}`);
      const data = await res.json();
      if (!res.ok) {
        setAdmitError('Patient not found. Check MRN or register new patient.');
        setFoundPatient(null);
      } else {
        setFoundPatient(data.patient);
      }
    } finally {
      setSearchingPatient(false);
    }
  }

  // Handle Admission Submit
  async function handleAdmitSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBedForAdmit || (!admitMrn.trim() && !foundPatient)) {
      setAdmitError('Please select or lookup a patient MRN.');
      return;
    }

    setAdmitLoading(true);
    setAdmitError('');
    try {
      const res = await fetch('/api/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mrn: (foundPatient?.mrn || admitMrn).trim().toUpperCase(),
          bedId: selectedBedForAdmit._id,
          admittingDiagnosis: admitDiagnosis,
          attendingDoctor: admitDoctor,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAdmitError(data.error || 'Failed admitting patient');
        return;
      }

      setAdmitModalOpen(false);
      setAdmitMrn('');
      setAdmitDiagnosis('');
      setFoundPatient(null);
      loadWardData();
    } catch {
      setAdmitError('Network error while processing admission');
    } finally {
      setAdmitLoading(false);
    }
  }

  // Handle Discharge Submit
  async function handleDischargeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBedForDischarge || !selectedBedForDischarge.admission) return;

    try {
      const res = await fetch('/api/admissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admissionId: selectedBedForDischarge.admission._id,
          dischargeNotes,
        }),
      });

      if (res.ok) {
        setDischargeModalOpen(false);
        setDischargeNotes('');
        setSelectedBedForDischarge(null);
        loadWardData();
      } else {
        alert('Failed discharging patient.');
      }
    } catch {
      alert('Error connecting to server.');
    }
  }

  // Toggle Maintenance
  async function toggleBedMaintenance(bed: BedItem) {
    const newStatus = bed.status === 'Under Maintenance' ? 'Available' : 'Under Maintenance';
    try {
      const res = await fetch('/api/beds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bedId: bed._id, status: newStatus }),
      });
      if (res.ok) loadWardData();
    } catch {
      alert('Error updating bed status.');
    }
  }

  const filteredBeds = beds.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchBed = b.bedNumber.toLowerCase().includes(q);
    const matchPatient = b.patient?.fullName.toLowerCase().includes(q);
    const matchMrn = b.patient?.mrn.toLowerCase().includes(q);
    return matchBed || matchPatient || matchMrn;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="section-title flex items-center gap-2 text-lg sm:text-xl">
            <FaProcedures className="text-blue-600" /> Ward &amp; Bed Management
          </h1>
          <p className="section-subtitle mt-0.5 text-xs sm:text-sm">
            Real-time ward occupancy, bed allocation &amp; patient admissions
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button onClick={() => loadWardData()} className="btn-secondary text-xs py-2 justify-center flex-1 sm:flex-initial">
            <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={() => {
              const avail = beds.find((b) => b.status === 'Available');
              if (avail) {
                setSelectedBedForAdmit(avail);
                setAdmitModalOpen(true);
              } else {
                alert('No available beds to admit patient.');
              }
            }}
            className="btn-primary text-xs py-2 justify-center flex-1 sm:flex-initial"
          >
            <FiPlus /> Admit Patient
          </button>
        </div>
      </div>

      {/* Ward Occupancy Overview Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {wards.map((w) => (
          <div
            key={w._id}
            onClick={() => setSelectedWardId(w._id)}
            className={`card p-4 sm:p-5 cursor-pointer transition-all ${
              selectedWardId === w._id ? 'border-blue-500 ring-2 ring-blue-200' : 'hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">{w.wardName}</h3>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  w.occupancyRate >= 85
                    ? 'bg-red-100 text-red-700'
                    : w.occupancyRate >= 50
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {w.occupancyRate}% Occupied
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-3">
              <div
                className={`h-full transition-all ${
                  w.occupancyRate >= 85 ? 'bg-red-500' : w.occupancyRate >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${w.occupancyRate}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-3 text-center text-xs border-t border-slate-100 pt-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Total</span>
                <span className="font-bold text-slate-800">{w.totalBeds} Beds</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-red-500 block uppercase">Occupied</span>
                <span className="font-bold text-red-600">{w.occupiedCount}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-600 block uppercase">Available</span>
                <span className="font-bold text-emerald-600">{w.availableCount}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="card p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
        {/* Ward Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none w-full md:w-auto">
          <button
            onClick={() => setSelectedWardId('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
              selectedWardId === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Wards ({beds.length})
          </button>
          {wards.map((w) => (
            <button
              key={w._id}
              onClick={() => setSelectedWardId(w._id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                selectedWardId === w._id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {w.wardName} ({w.occupiedCount}/{w.totalBeds})
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            className="input pl-9 py-1.5 text-xs"
            placeholder="Search bed, patient name, MRN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Bed Grid Visualizer */}
      <div className="space-y-3">
        <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
          Bed Grid Layout ({filteredBeds.length})
        </h2>

        {loading ? (
          <div className="card p-8 sm:p-12 text-center text-slate-400 text-sm">
            <FiLoader className="animate-spin text-2xl text-blue-500 mx-auto mb-2" />
            Loading ward bed records...
          </div>
        ) : filteredBeds.length === 0 ? (
          <div className="card p-8 sm:p-12 text-center text-slate-500 text-sm">
            No beds found matching filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredBeds.map((bed) => {
              const isOccupied = bed.status === 'Occupied';
              const isAvailable = bed.status === 'Available';

              return (
                <div
                  key={bed._id}
                  className={`card p-4 relative flex flex-col justify-between transition-all ${
                    isOccupied
                      ? 'border-red-200 bg-red-50/20'
                      : isAvailable
                      ? 'border-emerald-200 bg-emerald-50/10 hover:border-emerald-400'
                      : 'border-amber-200 bg-amber-50/20'
                  }`}
                >
                  {/* Bed Header */}
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <span className="font-extrabold text-sm font-mono text-slate-900 flex items-center gap-1.5">
                      <FaProcedures className={isOccupied ? 'text-red-500' : isAvailable ? 'text-emerald-500' : 'text-amber-500'} />
                      {bed.bedNumber}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isOccupied
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : isAvailable
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {bed.status}
                    </span>
                  </div>

                  {/* Bed Body Content */}
                  <div className="space-y-2 min-h-[90px]">
                    {isOccupied && bed.patient ? (
                      <div>
                        <Link
                          href={`/patients/${bed.patient.mrn}`}
                          className="font-bold text-slate-900 text-sm hover:text-blue-600 block leading-tight truncate"
                        >
                          {bed.patient.fullName}
                        </Link>
                        <p className="text-xs font-mono font-bold text-blue-700 mt-0.5">
                          {bed.patient.mrn} · {bed.patient.gender}, {bed.patient.age}y
                        </p>
                        {bed.admission?.admittingDiagnosis && (
                          <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 bg-white p-1.5 rounded border border-slate-200">
                            <strong>Dx:</strong> {bed.admission.admittingDiagnosis}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          <FaUserMd className="text-slate-400" /> Attending: {bed.admission?.attendingDoctor || 'Dr. Haider Ali Khan'}
                        </p>
                      </div>
                    ) : isAvailable ? (
                      <div className="flex flex-col items-center justify-center py-4 text-center">
                        <FaCheckCircle className="text-2xl text-emerald-400 mb-1" />
                        <p className="text-xs font-semibold text-emerald-700">Ready for Admission</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4 text-center">
                        <FaExclamationTriangle className="text-2xl text-amber-400 mb-1" />
                        <p className="text-xs font-semibold text-amber-700">Out of Service</p>
                      </div>
                    )}
                  </div>

                  {/* Bed Action Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs mt-2">
                    {isOccupied ? (
                      <button
                        onClick={() => {
                          setSelectedBedForDischarge(bed);
                          setDischargeModalOpen(true);
                        }}
                        className="btn-danger py-1.5 px-2.5 text-xs w-full justify-center"
                      >
                        <FiLogOut /> Discharge Patient
                      </button>
                    ) : isAvailable ? (
                      <div className="flex gap-2 w-full">
                        <button
                          onClick={() => {
                            setSelectedBedForAdmit(bed);
                            setAdmitModalOpen(true);
                          }}
                          className="btn-primary py-1.5 px-2.5 text-xs flex-1 justify-center"
                        >
                          <FiPlus /> Admit
                        </button>
                        <button
                          onClick={() => toggleBedMaintenance(bed)}
                          className="btn-ghost py-1 px-2 text-[11px] border border-slate-200"
                          title="Mark under maintenance"
                        >
                          Maint.
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => toggleBedMaintenance(bed)}
                        className="btn-secondary py-1.5 px-2 text-xs w-full justify-center"
                      >
                        Mark Available
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ADMIT PATIENT MODAL */}
      {admitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50 shrink-0">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-800">Admit Patient to Ward</h3>
                <p className="text-xs text-slate-500">
                  Target Bed: <span className="font-bold text-blue-700">{selectedBedForAdmit?.bedNumber}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setAdmitModalOpen(false);
                  setFoundPatient(null);
                }}
                className="btn-ghost p-1.5"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAdmitSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
                {admitError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl">
                    {admitError}
                  </div>
                )}

                {/* Quick Select Today's Checked / Recent Patients */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <FaUserInjured className="text-blue-500" /> Today&apos;s Checked / Recent Patients
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">1-Click Auto Select</span>
                  </div>
                  {loadingRecent ? (
                    <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <FiLoader className="animate-spin text-blue-500" /> Loading patients...
                    </div>
                  ) : recentPatients.length === 0 ? (
                    <p className="text-xs text-slate-400 italic p-2 bg-slate-50 rounded-lg">No recent patients found.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-50 border border-slate-200 rounded-xl">
                      {recentPatients.map((p) => {
                        const isSelected = (foundPatient?.mrn || admitMrn) === p.mrn;
                        return (
                          <button
                            key={p.mrn}
                            type="button"
                            onClick={() => selectSuggestedPatient(p)}
                            className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-all text-left ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'
                            }`}
                          >
                            <FaHeartbeat className={isSelected ? 'text-white' : 'text-blue-500'} />
                            <span>{p.fullName}</span>
                            <span className={`text-[10px] font-mono ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                              ({p.mrn})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Patient Selection / Lookup */}
                <div className="field-group">
                  <label className="label">Patient MRN *</label>
                  <div className="flex gap-2">
                    <input
                      className="input uppercase font-mono text-sm"
                      placeholder="e.g. NC-2026-0001"
                      value={admitMrn}
                      onChange={(e) => {
                        setAdmitMrn(e.target.value);
                        setFoundPatient(null);
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => handleLookupPatient(admitMrn)}
                      className="btn-secondary text-xs"
                      disabled={searchingPatient || !admitMrn.trim()}
                    >
                      {searchingPatient ? <FiLoader className="animate-spin" /> : <FiSearch />} Lookup
                    </button>
                  </div>
                </div>

                {/* Selected Patient Details Preview */}
                {foundPatient && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                      {foundPatient.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{foundPatient.fullName}</p>
                      <p className="text-[11px] text-slate-600">
                        {foundPatient.mrn} · {foundPatient.gender}, {foundPatient.age}y · Phone: {foundPatient.contact}
                      </p>
                    </div>
                  </div>
                )}

                {/* Admitting Diagnosis */}
                <div className="field-group">
                  <label className="label">Admitting Diagnosis *</label>
                  <input
                    className="input text-xs"
                    placeholder="e.g. Lumbar Disc Herniation, Hydrocephalus"
                    value={admitDiagnosis}
                    onChange={(e) => setAdmitDiagnosis(e.target.value)}
                    required
                  />
                </div>

                {/* Attending Doctor */}
                <div className="field-group">
                  <label className="label">Attending Doctor</label>
                  <input
                    className="input text-xs"
                    value={admitDoctor}
                    onChange={(e) => setAdmitDoctor(e.target.value)}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setAdmitModalOpen(false);
                    setFoundPatient(null);
                  }}
                  className="btn-secondary w-full sm:w-auto justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={admitLoading || (!admitMrn.trim() && !foundPatient)}
                  className="btn-primary w-full sm:w-auto justify-center"
                >
                  {admitLoading ? <FiLoader className="animate-spin" /> : <FiPlus />} Complete Admission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISCHARGE PATIENT MODAL */}
      {dischargeModalOpen && selectedBedForDischarge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden my-auto">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-800">Discharge Patient</h3>
                <p className="text-xs text-slate-500">
                  Bed: <span className="font-bold text-slate-900">{selectedBedForDischarge.bedNumber}</span>
                </p>
              </div>
              <button onClick={() => setDischargeModalOpen(false)} className="btn-ghost p-1.5">
                <FiX className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleDischargeSubmit} className="p-4 sm:p-6 space-y-4">
              {selectedBedForDischarge.patient && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="font-bold text-slate-900 text-xs">{selectedBedForDischarge.patient.fullName}</p>
                  <p className="text-[11px] text-slate-500">
                    MRN: <span className="font-mono font-bold text-blue-700">{selectedBedForDischarge.patient.mrn}</span>
                  </p>
                </div>
              )}

              <div className="field-group">
                <label className="label">Discharge Notes &amp; Instructions</label>
                <textarea
                  className="input min-h-[80px] text-xs resize-y"
                  placeholder="Summary of ward stay, recovery state, post-discharge medication..."
                  value={dischargeNotes}
                  onChange={(e) => setDischargeNotes(e.target.value)}
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setDischargeModalOpen(false)} className="btn-secondary w-full sm:w-auto justify-center">
                  Cancel
                </button>
                <button type="submit" className="btn-danger w-full sm:w-auto justify-center">
                  <FiLogOut /> Confirm Discharge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
