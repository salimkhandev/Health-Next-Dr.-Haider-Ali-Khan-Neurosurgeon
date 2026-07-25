'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface TopDiagnosis {
  name: string;
  count: number;
}

interface WardStat {
  wardName: string;
  total: number;
  occupied: number;
  available: number;
  rate: number;
}

interface Props {
  topDiagnoses: TopDiagnosis[];
  wardStats: WardStat[];
}

export default function DashboardCharts({ topDiagnoses, wardStats }: Props) {
  // Diagnoses Doughnut Chart Data
  const dxChartData = {
    labels: topDiagnoses.length > 0 ? topDiagnoses.map((d) => d.name) : ['No diagnoses logged yet'],
    datasets: [
      {
        data: topDiagnoses.length > 0 ? topDiagnoses.map((d) => d.count) : [1],
        backgroundColor: [
          '#3b82f6', // blue
          '#ef4444', // red
          '#8b5cf6', // purple
          '#f59e0b', // amber
          '#10b981', // emerald
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  // Ward Occupancy Bar Chart Data
  const wardChartData = {
    labels: wardStats.map((w) => w.wardName),
    datasets: [
      {
        label: 'Occupied Beds',
        data: wardStats.map((w) => w.occupied),
        backgroundColor: '#ef4444',
        borderRadius: 6,
      },
      {
        label: 'Available Beds',
        data: wardStats.map((w) => w.available),
        backgroundColor: '#10b981',
        borderRadius: 6,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
    },
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: { stacked: true, grid: { color: '#f1f5f9' }, ticks: { stepSize: 1 } },
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Top Diagnoses Distribution */}
      <div className="card p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Top Diagnoses Distribution
        </h3>
        <div className="h-56 flex items-center justify-center">
          <Doughnut data={dxChartData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </div>

      {/* Ward Occupancy Rates */}
      <div className="card p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Ward Bed Occupancy Rates
        </h3>
        <div className="h-56 flex items-center justify-center">
          <Bar data={wardChartData} options={barOptions} height={200} />
        </div>
      </div>
    </div>
  );
}
