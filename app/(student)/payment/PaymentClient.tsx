'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { compressImage } from '@/lib/image';
import { safeJson } from '@/lib/safeJson';

interface CourseOption {
  id: string;
  title: string;
  price: number;
}

export default function PaymentClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [coursesLoading, setCoursesLoading] = useState(true);

  const [method, setMethod] = useState('easypaisa');
  const [file, setFile] = useState<File | null>(null);
  const [agreed, setAgreed] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load available courses so the student can pick which one they are paying for
  useEffect(() => {
    fetch('/api/courses/public')
      .then(r => safeJson<CourseOption[]>(r))
      .then((data) => {
        setCourses(data);
        if (data.length > 0) setSelectedCourseId(data[0].id);
      })
      .catch(() => {})
      .finally(() => setCoursesLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!selectedCourseId) {
      setError('Please select a course to enroll in.');
      return;
    }

    if (!file) {
      setError('Please attach a screenshot of your payment.');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (jpg or png).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Please select an image smaller than 10MB.');
      return;
    }

    if (!agreed) {
      setError('You must agree to the Terms & Conditions and Refund Policy.');
      return;
    }

    setLoading(true);

    try {
      // 1. Compress image locally (800x800, 70% quality for tiny size)
      const compressedBlob = await compressImage(file, 800, 800, 0.7);
      
      // 2. Get presigned URL
      const urlRes = await fetch('/api/upload/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: 'image/jpeg' })
      });
      
      if (!urlRes.ok) throw new Error('Failed to get upload URL');
      const { url, key, isGoogleDrive } = await safeJson<{ url: string; key: string; isGoogleDrive?: boolean }>(urlRes);

      // 3. Upload directly
      const uploadRes = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
        body: compressedBlob
      });

      if (!uploadRes.ok) throw new Error('Failed to upload screenshot');

      let finalKey = key;
      let driveFileId = undefined;

      if (isGoogleDrive) {
        const fileMetadata = await safeJson<{ id: string }>(uploadRes);
        driveFileId = fileMetadata.id;
        finalKey = '';
      }

      // 4. Submit payment record to our DB
      const submitRes = await fetch('/api/payment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourseId,
          amount: courses.find(c => c.id === selectedCourseId)?.price ?? 0,
          paymentMethod: method,
          screenshotKey: finalKey,
          driveFileId: driveFileId,
        })
      });

      if (!submitRes.ok) {
        const d = await safeJson<{ error?: string }>(submitRes);
        throw new Error(d.error || 'Failed to submit payment record');
      }

      // Success! NextAuth token status won't update until session refresh, 
      // but router.refresh() triggers a middleware check. The simplest flow
      // is to manually navigate to pending.
      window.location.href = '/payment/pending';
      
    } catch (err: any) {
      console.error('Payment submission error:', err);
      setError(err?.message || 'An error occurred during submission.');
      setLoading(false);
    }
  }

  return (
    <div className="card max-w-xl mx-auto w-full">
      <h1 className="text-2xl font-bold mb-2">Complete Your Payment</h1>

      {/* Course selection */}
      {coursesLoading ? (
        <p className="text-sm text-muted mb-4">Loading courses...</p>
      ) : courses.length === 0 ? (
        <p className="text-sm text-secondary mb-4">No courses available yet. Please check back later.</p>
      ) : (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1.5">Select Course to Enroll</label>
          <select
            className="input"
            value={selectedCourseId}
            onChange={e => setSelectedCourseId(e.target.value)}
            required
          >
            {courses.map(c => (
              <option key={c.id} value={c.id}>
                {c.title} — Rs. {c.price.toLocaleString()}
              </option>
            ))}
          </select>
        </div>
      )}

      <p className="text-sm text-secondary mb-6">
        {selectedCourseId && courses.find(c => c.id === selectedCourseId) ? (
          <>Enrollment fee: <strong>Rs. {courses.find(c => c.id === selectedCourseId)!.price.toLocaleString()}</strong>. Transfer the amount below then submit your proof.</>
        ) : (
          <>Please select a course above to see the enrollment fee.</>
        )}
      </p>

      {/* Payment Instructions */}
      <div className="mb-6 p-4 rounded-lg" style={{ background: 'var(--surface-1)', border: '1px solid var(--surface-2)' }}>
        <h3 className="font-medium mb-3">Our Account Details:</h3>
        
        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" name="method" checked={method === 'easypaisa'} onChange={() => setMethod('easypaisa')} />
            EasyPaisa
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" name="method" checked={method === 'jazzcash'} onChange={() => setMethod('jazzcash')} />
            JazzCash
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" name="method" checked={method === 'bank'} onChange={() => setMethod('bank')} />
            Bank Transfer
          </label>
        </div>

        <div className="text-sm text-secondary p-3 rounded bg-surface-2">
          {method === 'easypaisa' && (
            <><strong>EasyPaisa:</strong> 0342-5015034<br/>Title: Hafiz Mujeeb ur Rahman</>
          )}
          {method === 'jazzcash' && (
            <><strong>JazzCash:</strong> 0318-5263800<br/>Title: Hafiz Mujeeb ur Rahman</>
          )}
          {method === 'bank' && (
            <><strong>Meezan Bank</strong><br/>Acc: 03425015034<br/>Title: Sunrise Academy / Hafiz Mujeeb</>
          )}
        </div>
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        <div>
          <label className="block text-sm font-medium mb-1.5">Payment Screenshot</label>
          <div 
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors"
            style={{ borderColor: file ? 'var(--brand-500)' : 'var(--surface-2)' }}
            onClick={() => fileInputRef.current?.click()}
          >
            {file ? (
              <span className="text-sm font-medium" style={{ color: 'var(--brand-500)' }}>
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB) - Ready to upload
              </span>
            ) : (
              <span className="text-sm text-secondary">
                Click to browse or take a photo
              </span>
            )}
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*"
              className="hidden"
              style={{ display: 'none' }}
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>

        <div className="flex items-start gap-3 mt-4">
          <input 
            type="checkbox" 
            id="terms" 
            className="mt-1"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
          />
          <label htmlFor="terms" className="text-sm text-secondary">
            I agree to the <Link href="/terms" className="text-brand-400">Terms & Conditions</Link> and <Link href="/refund" className="text-brand-400">Refund Policy</Link>
          </label>
        </div>

        <button className="btn-primary mt-4" type="submit" disabled={loading}>
          {loading ? <span className="spinner" /> : null}
          {loading ? 'Submitting...' : 'Submit Payment Proof'}
        </button>
      </form>
    </div>
  );
}
