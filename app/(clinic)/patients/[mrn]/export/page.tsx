import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connectDB } from '@/lib/db';
import Patient from '@/lib/models/Patient';
import Visit from '@/lib/models/Visit';
import Settings from '@/lib/models/Settings';
import PrintButton from '@/components/prescription/PrintButton';
import { FaArrowLeft, FaHeartbeat, FaAllergies, FaStethoscope, FaPaperclip } from 'react-icons/fa';
import { FiFile } from 'react-icons/fi';

interface PageProps {
  params: Promise<{ mrn: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { mrn } = await params;
  return { title: `Full History Export ${mrn} — NitroClinic` };
}

export default async function FullHistoryExportPage({ params }: PageProps) {
  const { mrn } = await params;
  await connectDB();

  const patient = await Patient.findOne({ mrn }).lean();
  if (!patient) notFound();

  const visits = await Visit.find({ mrn }).sort({ visitDate: -1 }).lean();
  const settings = await Settings.findOne().lean();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar Actions (Hidden in Print) */}
      <div className="flex items-center justify-between print:hidden">
        <Link href={`/patients/${mrn}`} className="btn-secondary text-xs">
          <FaArrowLeft /> Back to Patient Profile
        </Link>
        <PrintButton />
      </div>

      {/* Printable Document Container */}
      <div className="bg-white rounded-2xl border border-slate-300 p-8 shadow-md print:shadow-none print:border-none print:p-0 print:m-0 space-y-6">
        {/* Doctor & Hospital Header */}
        <div className="border-b-2 border-blue-600 pb-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-blue-600 shrink-0 bg-slate-100">
              <Image
                src={settings?.hospitalLogoUrl || '/DR-IMAGE.png'}
                alt={settings?.doctorName || 'Dr. Haider Ali Khan'}
                fill
                className="object-cover object-top"
                priority
              />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {settings?.doctorName || 'Dr. Haider Ali Khan'}
              </h1>
              <p className="text-xs font-bold text-blue-700 uppercase">
                {settings?.specialization || 'Neurosurgeon'}
              </p>
              <p className="text-[11px] text-slate-600 font-medium max-w-md mt-0.5 leading-tight">
                {settings?.qualifications}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs font-extrabold text-red-500 uppercase tracking-widest block">
              {settings?.hospitalName || 'Health Next'}
            </span>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mt-1">
              FULL MEDICAL HISTORY REPORT
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Generated: {new Date().toLocaleDateString('en-GB')}
            </p>
          </div>
        </div>

        {/* Patient Demographics & Profile Summary */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Patient Name</span>
            <span className="font-bold text-slate-900 text-sm">{patient.fullName}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">MRN</span>
            <span className="font-mono font-bold text-blue-700 text-sm">{patient.mrn}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Demographics</span>
            <span className="font-semibold text-slate-800">{patient.gender}, {patient.age} yrs</span>
            {patient.bloodGroup && <span className="text-slate-500 block">Blood: {patient.bloodGroup}</span>}
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Visits</span>
            <span className="font-extrabold text-blue-600 text-base">{patient.visitCount} visits</span>
          </div>
        </div>

        {/* Known Allergies & Chronic Conditions */}
        {(patient.allergies?.length > 0 || patient.chronicConditions?.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {patient.allergies?.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <span className="font-bold text-red-700 flex items-center gap-1 mb-1">
                  <FaAllergies /> Known Allergies
                </span>
                <p className="text-red-900 font-semibold">{patient.allergies.join(', ')}</p>
              </div>
            )}
            {patient.chronicConditions?.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <span className="font-bold text-amber-800 flex items-center gap-1 mb-1">
                  <FaHeartbeat /> Chronic Conditions
                </span>
                <p className="text-amber-900 font-semibold">{patient.chronicConditions.join(', ')}</p>
              </div>
            )}
          </div>
        )}

        {/* Complete Visit Timeline */}
        <div className="space-y-4 pt-2">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
            <FaStethoscope className="text-blue-600" /> Chronological Consultation Timeline ({visits.length})
          </h2>

          {visits.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4">No visits recorded for this patient.</p>
          ) : (
            visits.map((v, index) => (
              <div key={v._id.toString()} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      Visit #{visits.length - index}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {new Date(v.visitDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  {v.confirmedDiagnosis && (
                    <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                      Diagnosis: {v.confirmedDiagnosis}
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
                {v.symptoms && v.symptoms.length > 0 && (
                  <div className="text-xs">
                    <span className="font-bold text-slate-500 uppercase text-[10px] block">Symptoms:</span>
                    <span className="text-slate-800 font-medium">{v.symptoms.join(', ')}</span>
                  </div>
                )}

                {/* Prescribed Medicines */}
                {v.medicinesPrescribed && v.medicinesPrescribed.length > 0 && (
                  <div className="text-xs">
                    <span className="font-bold text-slate-500 uppercase text-[10px] block mb-1">Prescribed Medicines:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 bg-white p-2.5 rounded-lg border border-slate-200">
                      {v.medicinesPrescribed.map((m, i) => (
                        <div key={i} className="text-slate-800 font-medium">
                          • <span className="font-bold">{m.name}</span> ({m.dosage}, {m.frequency}, {m.duration})
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prescribed Tests */}
                {v.testsPrescribed && v.testsPrescribed.length > 0 && (
                  <div className="text-xs">
                    <span className="font-bold text-slate-500 uppercase text-[10px] block">Prescribed Tests:</span>
                    <span className="text-emerald-700 font-bold">{v.testsPrescribed.join(', ')}</span>
                  </div>
                )}

                {/* Notes */}
                {v.doctorNotes && (
                  <p className="text-xs text-slate-600 italic bg-white p-2 rounded border border-slate-200">
                    &ldquo;{v.doctorNotes}&rdquo;
                  </p>
                )}

                {/* Attachments */}
                {v.attachments && v.attachments.length > 0 && (
                  <div className="text-xs flex items-center gap-2 pt-1">
                    <FaPaperclip className="text-slate-400" />
                    <span className="font-semibold text-slate-600">Attached Scans/Reports:</span>
                    {v.attachments.map((a, i) => (
                      <a key={i} href={a.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-medium">
                        {a.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-slate-200 flex items-end justify-between text-xs">
          <div className="text-[10px] text-slate-400">
            <p className="font-bold text-slate-600">End of History Report — Health Next</p>
            <p>Dr. Haider Ali Khan, Neurosurgeon</p>
          </div>
          <div className="text-center w-48">
            <div className="h-10 border-b border-slate-400 mb-1"></div>
            <p className="font-bold text-slate-800">{settings?.doctorName || 'Dr. Haider Ali Khan'}</p>
            <p className="text-[10px] text-slate-500">Authorized Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
}
