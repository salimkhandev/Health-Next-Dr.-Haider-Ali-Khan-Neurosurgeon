'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { compressImage } from '@/lib/image';
import Link from 'next/link';

export default function NewCoursePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(5000);
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Please select a course thumbnail image.');
      return;
    }

    setLoading(true);

    try {
      // 1. Get presigned upload URL from server
      const urlRes = await fetch('/api/upload/thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type, filename: file.name })
      });
      
      if (!urlRes.ok) {
        const d = await urlRes.json();
        throw new Error(d.error || 'Failed to get upload URL');
      }
      
      const { url, key, isGoogleDrive } = await urlRes.json();

      // 2. Compress then upload directly
      const compressedBlob = await compressImage(file, 800, 800, 0.7);
      const uploadRes = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: compressedBlob
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        console.error('Thumbnail upload failed:', uploadRes.status, errorText);
        throw new Error(`Failed to upload thumbnail: ${uploadRes.status} ${errorText}`);
      }

      let finalKey = key;
      let finalDriveFileId = undefined;

      if (isGoogleDrive) {
        const fileMetadata = await uploadRes.json();
        finalDriveFileId = fileMetadata.id;
        finalKey = '';
      }

      // 3. Create the Course document in MongoDB
      const createRes = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, price, thumbnailKey: finalKey, driveThumbnailId: finalDriveFileId })
      });

      if (!createRes.ok) {
        const d = await createRes.json();
        throw new Error(d.error || 'Failed to save course data.');
      }

      const { id } = await createRes.json();
      router.push(`/admin/courses/${id}`);

    } catch (err: any) {
      setError(err.message || 'An error occurred.');
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="mb-6">
        <Link href="/admin/courses" className="text-xs text-muted hover:underline">
          ← Back to Course Manager
        </Link>
        <h1 className="text-2xl font-bold mt-2">Create New Course</h1>
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Course Title</label>
          <input 
            className="input" 
            type="text" 
            placeholder="e.g. Next.js App Router Masterclass"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required 
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Description</label>
          <textarea 
            className="input" 
            rows={4}
            placeholder="What will students learn in this course?"
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ resize: 'vertical' }}
            required 
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Enrollment Price (PKR)</label>
          <input
            className="input"
            type="number"
            min={1}
            placeholder="e.g. 5000"
            value={price}
            onChange={e => setPrice(Number(e.target.value))}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Thumbnail Image</label>
          <div 
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors"
            style={{ borderColor: file ? 'var(--brand-500)' : 'var(--surface-2)' }}
            onClick={() => fileInputRef.current?.click()}
          >
            {file ? (
              <span className="text-sm font-medium" style={{ color: 'var(--brand-500)' }}>
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            ) : (
              <span className="text-sm text-secondary">
                Choose an image file (PNG/JPG)
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

        <button className="btn-primary mt-4" type="submit" disabled={loading}>
          {loading ? <span className="spinner" /> : null}
          {loading ? 'Creating...' : 'Create Course & Add Videos'}
        </button>
      </form>
    </div>
  );
}
