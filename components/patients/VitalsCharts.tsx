'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import type { IVisit, IVitals } from '@/lib/models/Visit';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend
);

interface Props {
  visits: IVisit[];
}

function buildVitalsDataset(visits: IVisit[], key: keyof IVitals, label: string, color: string) {
  const filtered = visits
    .filter((v) => v.vitals?.[key] != null)
    .slice()
    .reverse();

  return {
    labels: filtered.map((v) =>
      new Date(v.visitDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    ),
    datasets: [
      {
        label,
        data: filtered.map((v) => Number(v.vitals![key])),
        borderColor: color,
        backgroundColor: color + '20',
        borderWidth: 2,
        pointRadius: 4,
        tension: 0.35,
        fill: true,
      },
    ],
  };
}

function buildVisitBarData(visits: IVisit[]) {
  // Group visit counts by month
  const counts: Record<string, number> = {};
  visits.forEach((v) => {
    const m = new Date(v.visitDate).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
    counts[m] = (counts[m] ?? 0) + 1;
  });
  const labels = Object.keys(counts).slice(-12);
  return {
    labels,
    datasets: [
      {
        label: 'Visits',
        data: labels.map((l) => counts[l]),
        backgroundColor: '#3b82f620',
        borderColor: '#3b82f6',
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };
}

const chartOptions = {
  responsive: true,
  plugins: { legend: { display: false }, tooltip: { mode: 'index' as const, intersect: false } },
  scales: {
    y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 } } },
    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
  },
};

export default function VitalsCharts({ visits }: Props) {
  const pulseData = buildVitalsDataset(visits, 'pulse', 'Pulse (bpm)', '#ef4444');
  const weightData = buildVitalsDataset(visits, 'weight', 'Weight (kg)', '#8b5cf6');
  const visitBarData = buildVisitBarData(visits);

  const hasVitals = visits.some((v) => v.vitals?.pulse || v.vitals?.weight);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Visit frequency */}
      <div className="card p-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Visit Frequency</h3>
        {visits.length < 2 ? (
          <p className="text-slate-400 text-xs text-center py-6">Not enough data</p>
        ) : (
          <Bar data={visitBarData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }} height={140} />
        )}
      </div>

      {/* Pulse trend */}
      <div className="card p-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Pulse (bpm)</h3>
        {!hasVitals || pulseData.labels.length < 2 ? (
          <p className="text-slate-400 text-xs text-center py-6">No pulse data recorded</p>
        ) : (
          <Line data={pulseData} options={chartOptions} height={140} />
        )}
      </div>

      {/* Weight trend */}
      <div className="card p-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Weight (kg)</h3>
        {!hasVitals || weightData.labels.length < 2 ? (
          <p className="text-slate-400 text-xs text-center py-6">No weight data recorded</p>
        ) : (
          <Line data={weightData} options={chartOptions} height={140} />
        )}
      </div>
    </div>
  );
}
