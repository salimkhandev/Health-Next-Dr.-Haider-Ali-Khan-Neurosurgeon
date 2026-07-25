'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  FaUserInjured, FaStethoscope, FaProcedures, FaHeartbeat, FaCalendarAlt, FaPhoneAlt,
} from 'react-icons/fa';
import { FiPlus, FiLoader, FiChevronRight } from 'react-icons/fi';
import DashboardCharts from '@/components/dashboard/DashboardCharts';

interface DashboardData {
  kpis: {
    totalPatients: number;
    todayVisits: number;
    activeAdmissions: number;
    totalBeds: number;
    occupiedBeds: number;
    overallOccupancyRate: number;
  };
  followUpsDue: {
    _id: string;
    mrn: string;
    patientName: string;
    patientContact: string;
    nextFollowUpDate: string;
    confirmedDiagnosis?: string;
  }[];
  topDiagnoses: { name: string; count: number }[];
  wardStats: {
    wardName: string;
    total: number;
    occupied: number;
    available: number;
    rate: number;
  }[];
  settings: {
    doctorName: string;
    specialization: string;
    qualifications: string;
    hospitalName: string;
    hospitalLogoUrl: string;
    contactDetails: string;
    specializationsList: string[];
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/dashboard');
        const json = await res.json();
        setData(json);
      } catch {
        console.error('Failed fetching dashboard data');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400 space-y-3">
        <FiLoader className="animate-spin text-3xl text-blue-500" />
        <p className="text-sm font-semibold">Loading Health Next Dashboard...</p>
      </div>
    );
  }

  const { kpis, followUpsDue, topDiagnoses, wardStats, settings } = data!;

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
      {/* 1. Doctor Profile Header Feature Card */}
      <div className="card p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white shadow-xl relative overflow-hidden">
        {/* Subtle background graphic */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='0.2'%3E%3Cpath d='M30 0l30 30-30 30L0 30z'/%3E%3C/g%3E%3C/svg%3E")` }}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-start justify-between gap-4">
          {/* Doctor info */}
          <div className="flex items-start gap-3 sm:gap-5">
            <div className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 sm:border-4 border-blue-500 shrink-0 shadow-lg bg-slate-800">
              <Image
                src={settings?.hospitalLogoUrl || '/DR-IMAGE.png'}
                alt={settings?.doctorName || 'Dr. Haider Ali Khan'}
                fill
                className="object-cover object-top"
                priority
              />
            </div>
            <div className="space-y-0.5 sm:space-y-1 min-w-0">
              <div className="inline-block bg-gradient-to-r from-blue-600 to-red-500 text-white text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-widest">
                {settings?.hospitalName || 'Health Next'}
              </div>
              <h1 className="text-base sm:text-2xl font-extrabold tracking-tight leading-tight">
                {settings?.doctorName || 'Dr. Haider Ali Khan'}
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-blue-400">
                {settings?.specialization || 'Neurosurgeon'}
              </p>
              <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed hidden sm:block">
                {settings?.qualifications || 'MBBS, FCPS (Neurosurgery), Fellowship Endoscopic Neurosurgery, CHPE, Arab Spine Diploma'}
              </p>
              {/* Specializations Pills — hidden on mobile */}
              {settings?.specializationsList && settings.specializationsList.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1 hidden sm:flex">
                  {settings.specializationsList.map((spec, i) => (
                    <span key={i} className="bg-slate-800/80 text-blue-200 border border-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {spec}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions — row on mobile, column on md+ */}
          <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto shrink-0 mt-1 md:mt-0">
            <Link href="/consultation" className="btn-primary justify-center flex-1 md:flex-initial shadow-md">
              <FiPlus /> <span className="hidden xs:inline sm:inline">New </span>Consult
            </Link>
            <Link href="/patients" className="btn-secondary justify-center flex-1 md:flex-initial text-xs py-2 bg-white/10 hover:bg-white/20 text-white border-slate-700">
              <FaUserInjured /> <span className="hidden sm:inline">Patients</span>
              <span className="sm:hidden">Pts</span>
            </Link>
            <Link href="/wards" className="btn-secondary justify-center flex-1 md:flex-initial text-xs py-2 bg-white/10 hover:bg-white/20 text-white border-slate-700">
              <FaProcedures /> <span className="hidden sm:inline">Wards</span>
              <span className="sm:hidden">Ward</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. High-Level KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="card p-3.5 sm:p-5 flex items-center justify-between border-l-4 border-l-blue-600">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Total Patients</p>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5 sm:mt-1">{kpis.totalPatients}</p>
            <p className="text-[10px] text-slate-500 hidden sm:block mt-0.5">Registered MRN records</p>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-base sm:text-xl shrink-0">
            <FaUserInjured />
          </div>
        </div>

        <div className="card p-3.5 sm:p-5 flex items-center justify-between border-l-4 border-l-emerald-600">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Today&apos;s Visits</p>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5 sm:mt-1">{kpis.todayVisits}</p>
            <p className="text-[10px] text-slate-500 hidden sm:block mt-0.5">Consultations today</p>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-base sm:text-xl shrink-0">
            <FaStethoscope />
          </div>
        </div>

        <div className="card p-3.5 sm:p-5 flex items-center justify-between border-l-4 border-l-purple-600">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Ward Admits</p>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5 sm:mt-1">{kpis.activeAdmissions}</p>
            <p className="text-[10px] text-slate-500 hidden sm:block mt-0.5">Patients in beds</p>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-base sm:text-xl shrink-0">
            <FaProcedures />
          </div>
        </div>

        <div className="card p-3.5 sm:p-5 flex items-center justify-between border-l-4 border-l-red-600">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Occupancy</p>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5 sm:mt-1">{kpis.overallOccupancyRate}%</p>
            <p className="text-[10px] text-slate-500 hidden sm:block mt-0.5">
              {kpis.occupiedBeds}/{kpis.totalBeds} beds
            </p>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-base sm:text-xl shrink-0">
            <FaHeartbeat />
          </div>
        </div>
      </div>

      {/* 3. Follow-ups Due This Week Widget */}
      <div className="card p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <FaCalendarAlt className="text-amber-500" />
            <span className="hidden sm:inline">Follow-ups Due This Week</span>
            <span className="sm:hidden">Follow-ups Due</span>
          </h2>
          <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            {followUpsDue.length} Due
          </span>
        </div>

        {followUpsDue.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4 text-center">
            No patient follow-ups due in the next 7 days.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {followUpsDue.map((item) => (
              <Link
                key={item._id}
                href={`/patients/${item.mrn}`}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/40 transition-all flex items-center justify-between group"
              >
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 block">
                    {item.patientName}
                  </span>
                  <span className="text-[11px] font-mono text-blue-700 font-semibold block">
                    {item.mrn}
                  </span>
                  {item.confirmedDiagnosis && (
                    <span className="text-[10px] text-slate-500 block truncate max-w-[180px]">
                      Dx: {item.confirmedDiagnosis}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <FaPhoneAlt className="text-slate-300" /> {item.patientContact}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 px-2 py-1 rounded block">
                    {new Date(item.nextFollowUpDate).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                  <FiChevronRight className="text-slate-300 group-hover:text-blue-500 mt-2 text-base ml-auto" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 4. Chart.js Visualizations */}
      <DashboardCharts topDiagnoses={topDiagnoses} wardStats={wardStats} />
    </div>
  );
}
