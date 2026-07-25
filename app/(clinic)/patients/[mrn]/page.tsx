import { notFound } from 'next/navigation';
import Link from 'next/link';
import { connectDB } from '@/lib/db';
import Patient from '@/lib/models/Patient';
import Visit from '@/lib/models/Visit';
import VitalsCharts from '@/components/patients/VitalsCharts';
import {
  FaUserInjured, FaPhoneAlt, FaTint, FaAllergies,
  FaHeartbeat, FaProcedures, FaPaperclip,
} from 'react-icons/fa';
import { FiEdit, FiPrinter, FiShare2, FiPlus, FiDownload, FiFile } from 'react-icons/fi';
import type { IVisit } from '@/lib/models/Visit';

interface PageProps {
  params: Promise<{ mrn: string }>;
}

/* ---- Typed lean shapes ---- */
interface LeanMedicine { name: string; dosage: string; frequency: string; duration: string }
interface LeanAttachment { fileUrl: string; label: string; uploadedAt: string }
interface LeanVitals { bp?: string; temperature?: number; pulse?: number; weight?: number }
interface LeanVisit {
  _id: string;
  visitDate: string;
  confirmedDiagnosis?: string;
  symptoms: string[];
  medicinesPrescribed: LeanMedicine[];
  testsPrescribed: string[];
  doctorNotes?: string;
  vitals?: LeanVitals;
  attachments: LeanAttachment[];
  nextFollowUpDate?: string;
  editableUntil: string;
}
interface LeanPatient {
  _id: string;
  mrn: string;
  fullName: string;
  age: number;
  gender: string;
  contact: string;
  address?: string;
  bloodGroup?: string;
  allergies: string[];
  chronicConditions: string[];
  visitCount: number;
}

export async function generateMetadata({ params }: PageProps) {
  const { mrn } = await params;
  return { title: `Patient ${mrn} — NitroClinic` };
}

/* ---- Visit card ---- */
function VisitCard({ visit }: { visit: LeanVisit }) {
  const date = new Date(visit.visitDate);
  const isEditable = new Date(visit.editableUntil) > new Date();

  return (
    <div className="card p-4 sm:p-5 hover:shadow-md transition-shadow">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-xs font-mono text-blue-700 font-bold">
            {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          {visit.confirmedDiagnosis && (
            <p className="text-xs sm:text-sm font-semibold text-slate-800 mt-0.5">
              Dx: {visit.confirmedDiagnosis}
            </p>
          )}
        </div>
        <div className="flex gap-2 shrink-0 self-start">
          {isEditable && (
            <Link href={`/consultation?visit=${visit._id}`}
              className="btn-ghost text-xs py-1 px-2 text-amber-600 hover:bg-amber-50">
              <FiEdit className="text-xs" /> Edit
            </Link>
          )}
          <Link href={`/prescription/${visit._id}`} className="btn-ghost text-xs py-1 px-2">
            <FiPrinter className="text-xs" /> Print
          </Link>
        </div>
      </div>

      {/* Vitals */}
      {visit.vitals && (
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
          {visit.vitals.bp && <span className="tag text-[11px]">BP: {visit.vitals.bp}</span>}
          {visit.vitals.pulse && <span className="tag text-[11px]">Pulse: {visit.vitals.pulse} bpm</span>}
          {visit.vitals.temperature && <span className="tag text-[11px]">Temp: {visit.vitals.temperature}°C</span>}
          {visit.vitals.weight && <span className="tag text-[11px]">Wt: {visit.vitals.weight} kg</span>}
        </div>
      )}

      {/* Symptoms */}
      {visit.symptoms?.length > 0 && (
        <div className="mb-2">
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Symptoms</p>
          <div className="flex flex-wrap gap-1.5">
            {visit.symptoms.map((s, i) => <span key={i} className="tag-amber">{s}</span>)}
          </div>
        </div>
      )}

      {/* Medicines */}
      {visit.medicinesPrescribed?.length > 0 && (
        <div className="mb-2">
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Medicines</p>
          <div className="space-y-1">
            {visit.medicinesPrescribed.map((m, i) => (
              <div key={i} className="text-xs text-slate-700 flex flex-wrap gap-1 sm:gap-2">
                <span className="font-semibold">{m.name}</span>
                <span className="text-slate-400">· {m.dosage} · {m.frequency} · {m.duration}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tests */}
      {visit.testsPrescribed?.length > 0 && (
        <div className="mb-2">
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Tests</p>
          <div className="flex flex-wrap gap-1.5">
            {visit.testsPrescribed.map((t, i) => <span key={i} className="tag-green">{t}</span>)}
          </div>
        </div>
      )}

      {/* Doctor notes */}
      {visit.doctorNotes && (
        <p className="text-xs text-slate-600 italic border-l-2 border-slate-200 pl-2 mt-2">
          {visit.doctorNotes}
        </p>
      )}

      {/* Follow-up */}
      {visit.nextFollowUpDate && (
        <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5">
          <FaHeartbeat />
          Follow-up: {new Date(visit.nextFollowUpDate).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </div>
      )}

      {/* Attachments */}
      {visit.attachments?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5 flex items-center gap-1">
            <FaPaperclip /> Attachments
          </p>
          <div className="flex flex-wrap gap-2">
            {visit.attachments.map((a, i) => (
              <a key={i} href={a.fileUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors">
                <FiFile className="text-slate-400" />
                {a.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Page ---- */
export default async function PatientProfilePage({ params }: PageProps) {
  const { mrn } = await params;
  await connectDB();

  const rawPatient = await Patient.findOne({ mrn }).lean();
  if (!rawPatient) notFound();
  const patientDoc = JSON.parse(JSON.stringify(rawPatient)) as LeanPatient;

  const rawVisits = await Visit.find({ mrn }).sort({ visitDate: -1 }).lean();
  const visitDocs = JSON.parse(JSON.stringify(rawVisits)) as LeanVisit[];

  const { fullName, age, gender, contact, address, bloodGroup, allergies, chronicConditions, visitCount } = patientDoc;

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Patient header card */}
      <div className="card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            {/* Avatar */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shrink-0 text-2xl sm:text-3xl font-bold text-blue-600 border-2 border-blue-200">
              {fullName.charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">{fullName}</h1>
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
                  {mrn}
                </span>
              </div>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-3 text-xs sm:text-sm text-slate-600 mb-3">
                <span>{gender} · Age {age}</span>
                {bloodGroup && (
                  <span className="flex items-center gap-1">
                    <FaTint className="text-red-400" /> {bloodGroup}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <FaPhoneAlt className="text-slate-400 text-xs" /> {contact}
                </span>
                {address && <span>{address}</span>}
              </div>

              {allergies?.length > 0 && (
                <div className="mb-2">
                  <p className="text-[10px] font-bold uppercase text-red-400 tracking-wider mb-1 flex items-center justify-center sm:justify-start gap-1">
                    <FaAllergies /> Allergies
                  </p>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-1.5">
                    {allergies.map((a, i) => <span key={i} className="tag-red">{a}</span>)}
                  </div>
                </div>
              )}
              {chronicConditions?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase text-amber-500 tracking-wider mb-1 flex items-center justify-center sm:justify-start gap-1">
                    <FaHeartbeat /> Chronic Conditions
                  </p>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-1.5">
                    {chronicConditions.map((c, i) => <span key={i} className="tag-amber">{c}</span>)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats + actions */}
          <div className="flex flex-col items-center sm:items-end gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
            <div className="text-center sm:text-right">
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-600">{visitCount}</div>
              <div className="text-xs text-slate-400 font-medium">Total Visits</div>
            </div>
            <div className="flex flex-col gap-2 w-full sm:w-auto mt-1">
              <Link href={`/consultation?mrn=${mrn}`} className="btn-primary text-xs justify-center py-2">
                <FiPlus /> New Consultation
              </Link>
              <Link href={`/patients/${mrn}/export`} className="btn-secondary text-xs justify-center py-2">
                <FiDownload /> Export Full History
              </Link>
              <button className="btn-ghost text-xs justify-center border border-slate-200 rounded-lg py-2">
                <FiShare2 /> Share Link
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Vitals charts */}
      {visitDocs.length > 0 && (
        <div>
          <h2 className="section-title mb-3 flex items-center gap-2 text-base sm:text-lg">
            <FaHeartbeat className="text-red-400" /> Vitals &amp; Visit Trends
          </h2>
          {/* Cast lean visits to IVisit[] shape for chart — safe since structure matches */}
          <VitalsCharts visits={visitDocs as unknown as IVisit[]} />
        </div>
      )}

      {/* Visit timeline */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title flex items-center gap-2 text-base sm:text-lg">
            <FaUserInjured className="text-blue-500" /> Visit History
          </h2>
          <Link href={`/consultation?mrn=${mrn}`} className="btn-primary text-xs py-1.5 px-3">
            <FiPlus /> New Visit
          </Link>
        </div>
        {visitDocs.length === 0 ? (
          <div className="card py-12 sm:py-16 flex flex-col items-center text-center px-4">
            <FaProcedures className="text-4xl sm:text-5xl text-slate-200 mb-3" />
            <p className="text-slate-500 font-semibold text-sm sm:text-base">No visits recorded yet.</p>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-sm">
              Start a new consultation to log symptoms, diagnosis, and prescriptions.
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {visitDocs.map((v) => (
              <VisitCard key={v._id} visit={v} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
