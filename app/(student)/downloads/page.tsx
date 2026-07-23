'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getOfflineVideos, getOfflineVideoUrl, deleteOfflineVideo, revokeOfflineVideoUrl } from '@/lib/opfs';

interface OfflineVideoItem {
  videoId: string;
  courseId: string;
  courseTitle: string;
  videoTitle: string;
  filename: string;
  sizeBytes: number;
  downloadedAt: Date;
  localUrl?: string;
}

export default function OfflineDownloadsPage() {
  const [downloads, setDownloads] = useState<OfflineVideoItem[]>([]);
  const [activeVideo, setActiveVideo] = useState<{ title: string; url: string } | null>(null);

  async function loadDownloads() {
    const list = getOfflineVideos() as any[];
    // Resolve local file urls so they can be played back from memory directly
    const resolved = await Promise.all(
      list.map(async (v) => {
        let localUrl = '';
        try {
          localUrl = await getOfflineVideoUrl(v.videoId);
        } catch (err) {
          console.error('Failed to resolve OPFS URL for', v.videoId, err);
        }
        return {
          ...v,
          localUrl,
        };
      })
    );
    setDownloads(resolved);
  }

  useEffect(() => {
    loadDownloads();
  }, []);

  async function handleDelete(videoId: string) {
    if (!confirm('Delete this download from your offline storage?')) return;
    const target = downloads.find((d) => d.videoId === videoId);
    // Revoke the blob URL before deleting to free memory
    if (target?.localUrl) revokeOfflineVideoUrl(target.localUrl);
    await deleteOfflineVideo(videoId);
    if (activeVideo && target?.localUrl === activeVideo.url) {
      setActiveVideo(null);
    }
    loadDownloads();
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      
      <div className="mb-6">
        <Link href="/" className="text-xs text-muted hover:underline mb-2 inline-block">← Home</Link>
        <h1 className="text-xl font-bold">Saved Videos</h1>
      </div>

      {downloads.length === 0 ? (
        <div className="card text-center py-10 text-secondary">
          <p className="text-sm">No saved videos yet.</p>
          <p className="text-xs text-muted mt-1">Open a course video and tap <strong>Save for Offline</strong>.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          
          {/* Active Offline Player */}
          {activeVideo && (
            <div className="card flex flex-col gap-4" style={{ padding: '1.5rem' }}>
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-semibold text-lg truncate max-w-2xl">{activeVideo.title}</h3>
                <button 
                  className="text-sm font-medium text-muted hover:underline"
                  onClick={() => setActiveVideo(null)}
                >
                  Close Player
                </button>
              </div>
              
              <div style={{ background: '#000', borderRadius: '0.75rem', overflow: 'hidden', aspectRatio: '16/9' }}>
                <video 
                  src={activeVideo.url} 
                  controls 
                  controlsList="nodownload"
                  onContextMenu={e => e.preventDefault()}
                  style={{ width: '100%', height: '100%' }}
                  autoPlay
                />
              </div>
            </div>
          )}

          {/* Offline playlist */}
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-bold mb-2">Downloaded Videos</h2>
            {downloads.map((d) => (
              <div 
                key={d.videoId}
                className="card flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
                style={{ 
                  padding: '1.25rem', 
                  border: activeVideo?.url === d.localUrl ? '1px solid var(--brand-500)' : '1px solid var(--surface-2)',
                  background: activeVideo?.url === d.localUrl ? 'rgba(245,158,11,0.04)' : 'var(--surface-1)'
                }}
              >
                <div className="min-w-0 flex-1">
                  <span className="text-xs text-brand-400 font-semibold">{d.courseTitle}</span>
                  <h4 className="font-semibold text-sm mt-0.5 truncate">{d.videoTitle}</h4>
                  <p className="text-xs text-muted">{(d.sizeBytes / 1024 / 1024).toFixed(1)} MB · {new Date(d.downloadedAt).toLocaleDateString()}</p>
                </div>

                <div className="flex gap-1.5 self-start sm:self-auto shrink-0">
                  {d.localUrl && (
                    <button 
                      className="btn-primary text-xs px-3 py-1.5"
                      onClick={() => {
                        setActiveVideo({ title: d.videoTitle, url: d.localUrl! });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      {activeVideo?.url === d.localUrl ? 'Playing' : 'Play'}
                    </button>
                  )}
                  <button 
                    className="text-xs px-3 py-1.5 border rounded transition-colors"
                    style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}
                    onClick={() => handleDelete(d.videoId)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
