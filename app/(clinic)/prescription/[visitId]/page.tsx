import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connectDB } from '@/lib/db';
import Visit from '@/lib/models/Visit';
import Patient from '@/lib/models/Patient';
import Settings from '@/lib/models/Settings';
import PrintButton from '@/components/prescription/PrintButton';
import { FaHeartbeat, FaStethoscope, FaArrowLeft } from 'react-icons/fa';

interface PageProps {
  params: Promise<{ visitId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { visitId } = await params;
  return { title: `Prescription Slip ${visitId} — NitroClinic` };
}

export default async function PrescriptionPage({ params }: PageProps) {
  const { visitId } = await params;
  await connectDB();

  const visit = await Visit.findById(visitId).lean();
  if (!visit) notFound();

  const patient = await Patient.findOne({ mrn: visit.mrn }).lean();
  if (!patient) notFound();

  const settings = await Settings.findOne().lean();

  const dateStr = new Date(visit.visitDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Bar Actions (Hidden in Print) */}
      <div className="flex items-center justify-between print:hidden">
        <Link href={`/patients/${visit.mrn}`} className="btn-secondary text-xs">
          <FaArrowLeft /> Back to Patient Profile
        </Link>
        <div className="flex gap-2">
          <PrintButton />
        </div>
      </div>

      {/* Printable Prescription Slip ("Cheque") */}
      <div className="bg-white rounded-2xl border border-slate-300 p-4 sm:p-8 shadow-md print:shadow-none print:border-none print:p-0 print:m-0 space-y-4 sm:space-y-6">
        {/* Header: Health Next branding & Dr. Haider Ali Khan Letterhead */}
        <div className="border-b-2 border-blue-600 pb-4">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-blue-600 shrink-0 bg-slate-100 shadow-sm">
                <Image
                  src={settings?.hospitalLogoUrl || '/DR-IMAGE.png'}
                  alt={settings?.doctorName || 'Dr. Haider Ali Khan'}
                  fill
                  className="object-cover object-top"
                  priority
                />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {settings?.doctorName || 'Dr. Haider Ali Khan'}
                </h1>
                <p className="text-sm font-bold text-blue-700 uppercase tracking-wide">
                  {settings?.specialization || 'Neurosurgeon'}
                </p>
                <p className="text-xs text-slate-600 font-medium max-w-md mt-1 leading-snug">
                  {settings?.qualifications ||
                    'MBBS, FCPS (Neurosurgery), Fellowship Endoscopic Neurosurgery, CHPE, Arab Spine Diploma'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Reg #: <span className="font-semibold">{settings?.registrationNumber || 'PMC-12345-N'}</span>
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="inline-block bg-gradient-to-r from-blue-700 to-red-600 text-white font-extrabold text-xs px-3 py-1 rounded-md uppercase tracking-wider shadow-xs mb-1">
                {settings?.hospitalName || 'Health Next'}
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                {settings?.contactDetails || 'Phone: +92 300 0000000'}
              </p>
            </div>
          </div>

          {/* Specializations Pills */}
          {settings?.specializationsList && settings.specializationsList.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100 text-[10px]">
              <span className="font-bold text-slate-500 uppercase tracking-wider self-center mr-1">Specializes In:</span>
              {settings.specializationsList.map((spec, i) => (
                <span key={i} className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded border border-slate-200">
                  {spec}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Patient Details & Vitals Strip */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Patient Name</span>
            <span className="font-bold text-slate-900 text-sm">{patient.fullName}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">MRN &amp; Age/Gender</span>
            <span className="font-mono font-bold text-blue-700">{patient.mrn}</span>
            <span className="text-slate-600 block">{patient.gender}, {patient.age} yrs</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Visit Date</span>
            <span className="font-semibold text-slate-800">{dateStr}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vitals Summary</span>
            {visit.vitals && (visit.vitals.bp || visit.vitals.pulse || visit.vitals.temperature || visit.vitals.weight) ? (
              <span className="text-slate-700 font-medium block">
                {visit.vitals.bp && `BP: ${visit.vitals.bp} `}
                {visit.vitals.pulse && `P: ${visit.vitals.pulse}bpm `}
                {visit.vitals.weight && `Wt: ${visit.vitals.weight}kg`}
              </span>
            ) : (
              <span className="text-slate-400 italic">No vitals recorded</span>
            )}
          </div>
        </div>

        {/* Clinical Content: Rx Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Left Column: Symptoms, Diagnosis & Prescribed Tests */}
          <div className="space-y-4 md:border-r border-slate-200 pr-4">
            {/* Confirmed Diagnosis */}
            {visit.confirmedDiagnosis && (
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Confirmed Diagnosis</span>
                <span className="font-bold text-slate-900 text-sm">{visit.confirmedDiagnosis}</span>
              </div>
            )}

            {/* Symptoms */}
            {visit.symptoms && visit.symptoms.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Symptoms Reported</span>
                <div className="flex flex-wrap gap-1">
                  {visit.symptoms.map((s, i) => (
                    <span key={i} className="bg-amber-50 text-amber-800 text-[11px] font-semibold px-2 py-0.5 rounded border border-amber-200">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Prescribed Tests */}
            {visit.testsPrescribed && visit.testsPrescribed.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Required Tests / Scans</span>
                <ul className="space-y-1">
                  {visit.testsPrescribed.map((t, i) => (
                    <li key={i} className="text-xs text-slate-800 font-semibold bg-emerald-50 border border-emerald-200 rounded px-2 py-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column: Prescribed Medicines (Rx Symbol Header) */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <span className="text-2xl font-extrabold font-serif text-blue-700">Rx</span>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Prescribed Medications</h2>
            </div>

            {visit.medicinesPrescribed && visit.medicinesPrescribed.length > 0 ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                    <th className="p-2.5 rounded-l-md">Medicine Name</th>
                    <th className="p-2.5">Dosage</th>
                    <th className="p-2.5">Frequency</th>
                    <th className="p-2.5 rounded-r-md">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visit.medicinesPrescribed.map((m, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-bold text-slate-900 text-sm">{m.name}</td>
                      <td className="p-2.5 font-medium text-slate-700">{m.dosage || '—'}</td>
                      <td className="p-2.5 font-medium text-slate-700">{m.frequency || '—'}</td>
                      <td className="p-2.5 font-medium text-slate-700">{m.duration || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-slate-400 italic">No medications prescribed for this visit.</p>
            )}

            {/* Doctor Notes / Special Instructions */}
            {visit.doctorNotes && (
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Doctor Advice / Special Instructions</span>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed italic">
                  {visit.doctorNotes}
                </p>
              </div>
            )}

            {/* Next Follow-Up Date */}
            {visit.nextFollowUpDate && (
              <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center gap-2">
                <FaHeartbeat className="text-amber-600 text-base shrink-0" />
                <span>
                  <strong>Advised Follow-Up Visit:</strong>{' '}
                  {new Date(visit.nextFollowUpDate).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Prescription Footer: Doctor Signature Area */}
        <div className="pt-8 border-t border-slate-200 flex items-end justify-between">
          <div className="text-[10px] text-slate-400 space-y-0.5">
            <p className="font-semibold text-slate-600">NitroClinic Digital Prescription</p>
            <p>Generated on {new Date().toLocaleDateString('en-GB')}</p>
          </div>
          <div className="text-center w-48">
            <div className="h-12 border-b border-slate-400 mb-1"></div>
            <p className="text-xs font-bold text-slate-800">{settings?.doctorName || 'Dr. Haider Ali Khan'}</p>
            <p className="text-[10px] text-slate-500">Authorized Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
}
