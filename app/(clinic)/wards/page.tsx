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

  // Submit Admission
  async function handleAdmitSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!foundPatient || !selectedBedForAdmit) return;

    setAdmitLoading(true);
    setAdmitError('');

    try {
      const res = await fetch('/api/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mrn: foundPatient.mrn,
          wardId: selectedBedForAdmit.wardId,
          bedId: selectedBedForAdmit._id,
          admittingDiagnosis: admitDiagnosis,
          attendingDoctor: admitDoctor,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAdmitError(data.error || 'Failed to admit patient.');
        setAdmitLoading(false);
        return;
      }

      // Success
      setAdmitModalOpen(false);
      setSelectedBedForAdmit(null);
      setFoundPatient(null);
      setAdmitMrn('');
      setAdmitDiagnosis('');
      loadWardData();
    } catch {
      setAdmitError('Server error during admission.');
    } finally {
      setAdmitLoading(false);
    }
  }

  // Submit Discharge
  async function handleDischargeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBedForDischarge?.admission) return;

    setAdmitLoading(true);
    try {
      const res = await fetch(`/api/admissions/${selectedBedForDischarge.admission._id}/discharge`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dischargeNotes }),
      });

      if (res.ok) {
        setDischargeModalOpen(false);
        setSelectedBedForDischarge(null);
        setDischargeNotes('');
        loadWardData();
      }
    } finally {
      setAdmitLoading(false);
    }
  }

  // Toggle Maintenance status for a bed
  async function toggleBedMaintenance(bed: BedItem) {
    const newStatus = bed.status === 'Under Maintenance' ? 'Available' : 'Under Maintenance';
    try {
      await fetch(`/api/beds/${bed._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      loadWardData();
    } catch {
      alert('Failed updating bed status.');
    }
  }

  // Filtered beds list
  const filteredBeds = beds.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.bedNumber.toLowerCase().includes(q) ||
      b.patient?.fullName.toLowerCase().includes(q) ||
      b.patient?.mrn.toLowerCase().includes(q) ||
      b.admission?.admittingDiagnosis.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title flex items-center gap-2">
            <FaProcedures className="text-blue-600" /> Ward &amp; Bed Management
          </h1>
          <p className="section-subtitle mt-0.5">
            Real-time ward occupancy, bed allocation &amp; patient admissions
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadWardData()} className="btn-secondary text-xs">
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
            className="btn-primary text-xs"
          >
            <FiPlus /> Admit Patient
          </button>
        </div>
      </div>

      {/* Ward Occupancy Overview Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {wards.map((w) => (
          <div
            key={w._id}
            onClick={() => setSelectedWardId(w._id)}
            className={`card p-5 cursor-pointer transition-all ${
              selectedWardId === w._id ? 'border-blue-500 ring-2 ring-blue-200' : 'hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-extrabold text-slate-900 text-base">{w.wardName}</h3>
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
      <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Ward Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setSelectedWardId('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
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
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
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
        <div className="relative w-full sm:w-64">
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
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Bed Grid Layout ({filteredBeds.length})
        </h2>

        {loading ? (
          <div className="card p-12 text-center text-slate-400 text-sm">
            <FiLoader className="animate-spin text-2xl text-blue-500 mx-auto mb-2" />
            Loading ward bed records...
          </div>
        ) : filteredBeds.length === 0 ? (
          <div className="card p-12 text-center text-slate-500 text-sm">
            No beds found matching filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredBeds.map((bed) => {
              const isOccupied = bed.status === 'Occupied';
              const isAvailable = bed.status === 'Available';
              const isMaintenance = bed.status === 'Under Maintenance';

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
                        className="btn-danger py-1 px-2.5 text-xs w-full justify-center"
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
                          className="btn-primary py-1 px-2.5 text-xs flex-1 justify-center"
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
                        className="btn-secondary py-1 px-2 text-xs w-full justify-center"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden space-y-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-800">Admit Patient to Ward</h3>
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

            <form onSubmit={handleAdmitSubmit} className="p-6 space-y-4">
              {admitError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl">
                  {admitError}
                </div>
              )}

              {/* Patient MRN Search */}
              <div className="field-group">
                <label className="label">Patient MRN *</label>
                <div className="flex gap-2">
                  <input
                    className="input uppercase"
                    placeholder="NC-2026-XXXX"
                    value={admitMrn}
                    onChange={(e) => setAdmitMrn(e.target.value.toUpperCase())}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleLookupPatient(admitMrn)}
                    disabled={searchingPatient || !admitMrn.trim()}
                    className="btn-secondary shrink-0"
                  >
                    {searchingPatient ? <FiLoader className="animate-spin" /> : 'Find Patient'}
                  </button>
                </div>
              </div>

              {/* Patient Found Banner */}
              {foundPatient && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    {foundPatient.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{foundPatient.fullName}</p>
                    <p className="text-xs text-slate-500">
                      <span className="font-mono font-bold text-blue-700">{foundPatient.mrn}</span> · {foundPatient.gender}, {foundPatient.age}y · Contact: {foundPatient.contact}
                    </p>
                  </div>
                </div>
              )}

              <div className="field-group">
                <label className="label">Admitting Diagnosis *</label>
                <input
                  className="input"
                  placeholder="e.g. Subdural Hematoma, Lumbar Disc Herniation"
                  value={admitDiagnosis}
                  onChange={(e) => setAdmitDiagnosis(e.target.value)}
                  required
                />
              </div>

              <div className="field-group">
                <label className="label">Attending Doctor</label>
                <input
                  className="input"
                  value={admitDoctor}
                  onChange={(e) => setAdmitDoctor(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setAdmitModalOpen(false);
                    setFoundPatient(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={admitLoading || !foundPatient || !admitDiagnosis.trim()}
                  className="btn-primary"
                >
                  {admitLoading ? <FiLoader className="animate-spin" /> : 'Confirm Admission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISCHARGE PATIENT MODAL */}
      {dischargeModalOpen && selectedBedForDischarge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden space-y-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-800">Discharge Patient</h3>
                <p className="text-xs text-slate-500">Bed: {selectedBedForDischarge.bedNumber}</p>
              </div>
              <button onClick={() => setDischargeModalOpen(false)} className="btn-ghost p-1.5">
                <FiX className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleDischargeSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1 text-xs text-red-900">
                <p className="font-bold text-sm text-red-800">{selectedBedForDischarge.patient?.fullName}</p>
                <p className="font-mono">MRN: {selectedBedForDischarge.patient?.mrn}</p>
                <p>Admitted on: {selectedBedForDischarge.admission?.admissionDate ? new Date(selectedBedForDischarge.admission.admissionDate).toLocaleDateString('en-GB') : 'N/A'}</p>
              </div>

              <div className="field-group">
                <label className="label">Discharge Notes / Summary</label>
                <textarea
                  className="input min-h-[80px] resize-y text-xs"
                  placeholder="Patient condition at discharge, medications to continue, follow-up instructions..."
                  value={dischargeNotes}
                  onChange={(e) => setDischargeNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDischargeModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={admitLoading}
                  className="btn-danger"
                >
                  {admitLoading ? <FiLoader className="animate-spin" /> : 'Confirm Discharge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
