'use client';

import React from 'react';
import { FiPrinter, FiDownload } from 'react-icons/fi';

export default function PrintButton() {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => window.print()}
        className="btn-primary text-xs cursor-pointer shadow-sm"
      >
        <FiPrinter className="text-sm" /> Print Prescription Slip
      </button>
      <button
        onClick={() => window.print()}
        className="btn-secondary text-xs cursor-pointer"
      >
        <FiDownload className="text-sm" /> Save as PDF
      </button>
    </div>
  );
}
