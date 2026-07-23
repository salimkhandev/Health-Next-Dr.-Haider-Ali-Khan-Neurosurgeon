'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { isVideoDownloaded, downloadVideoToOPFS, getOfflineVideoUrl, revokeOfflineVideoUrl } from '@/lib/opfs';

interface VideoItem {
  id: string;
  order: number;
  title: string;
  duration: number;
}

interface CourseDetail {
  id: string;
  title: string;
  description: string;
  videos: VideoItem[];
}

export default function WatchVideoPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId as string;
  const videoId = params?.videoId as string;

  const videoRef = useRef<HTMLVideoElement>(null);

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  
  const [offline, setOffline] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. Fetch Course Data
  useEffect(() => {
    async function fetchCourse() {
      try {
        const res = await fetch(`/api/courses/${courseId}`);
        if (!res.ok) throw new Error('Failed to load course details.');
        const data = await res.json();
        
        setCourse(data);
        const active = data.videos.find((v: VideoItem) => v.id === videoId);
        setActiveVideo(active || data.videos[0] || null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (courseId) fetchCourse();
  }, [courseId, videoId]);

  // 2. Resolve Active Video URL (Streaming vs. Offline)
  useEffect(() => {
    async function resolveVideoUrl() {
      if (!videoId) return;

      // Reset URL and progress
      setVideoUrl('');
      setError('');

      // Check offline first
      const isDownloaded = isVideoDownloaded(videoId);
      setOffline(isDownloaded);

      if (isDownloaded) {
        try {
          const localUrl = await getOfflineVideoUrl(videoId);
          setVideoUrl(localUrl);
          return;
        } catch (err) {
          console.error('Failed to load offline video, falling back to streaming', err);
        }
      }

      // Fallback: Fetch streaming presigned URL
      try {
        const res = await fetch(`/api/video/${videoId}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to fetch streaming URL');
        }
        const { url } = await res.json();
        setVideoUrl(url);
      } catch (err: any) {
        setError(err.message || 'Failed to load video stream.');
      }
    }
    resolveVideoUrl();
    // Revoke any blob URL when videoId changes or component unmounts
    return () => {
      setVideoUrl(prev => {
        if (prev?.startsWith('blob:')) revokeOfflineVideoUrl(prev);
        return prev;
      });
    };
  }, [videoId]);

  // 3. Track Video Progress (Fire-and-forget)
  useEffect(() => {
    const videoElem = videoRef.current;
    if (!videoElem || !videoId) return;

    let lastLoggedPercent = 0;

    const handleTimeUpdate = () => {
      const duration = videoElem.duration;
      const currentTime = videoElem.currentTime;
      if (!duration) return;

      const percent = Math.round((currentTime / duration) * 100);
      
      // Log progress every 10% step
      if (percent >= lastLoggedPercent + 10) {
        lastLoggedPercent = percent;
        fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId,
            videoId,
            progressPercent: percent,
            secondsWatched: Math.round(currentTime),
          }),
        }).catch((err) => console.error('Failed to log watch progress', err));
      }
    };

    videoElem.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      videoElem.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [videoId, courseId, videoUrl]);

  // 4. Download Video Offline
  async function handleDownloadOffline() {
    if (!activeVideo || !course) return;

    setDownloading(true);
    setDownloadProgress(0);
    setError('');

    try {
      // Fetch download URL (6 hours expiry)
      const res = await fetch(`/api/video/${videoId}/download-url`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to request download URL.');
      }
      const { url } = await res.json();

      // Download directly to OPFS
      await downloadVideoToOPFS(
        videoId,
        courseId,
        course.title,
        activeVideo.title,
        url,
        (progress) => setDownloadProgress(progress)
      );

      // Explicitly cache the offline downloads page (the only page reachable without internet)
      // The SW (V6) caches /downloads automatically via stale-while-revalidate, this ensures
      // it's also populated before the user actually goes offline.
      if ('caches' in window) {
        try {
          const cache = await caches.open('app-cache-V13');
          await cache.add('/downloads');
        } catch (e) {
          console.warn('Failed to pre-cache /downloads for offline viewing', e);
        }
      }

      setOffline(true);
    } catch (err: any) {
      setError(err.message || 'Download failed.');
    } finally {
      setDownloading(false);
    }
  }

  function formatDuration(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  if (loading) return <div className="text-center py-12">Loading player...</div>;
  if (!course || !activeVideo) return <div className="text-center py-12">Course content not found.</div>;

  const sortedVideos = [...course.videos].sort((a, b) => a.order - b.order);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--surface-0)' }}>
      {/* Header */}
      <header style={{ height: '60px', borderBottom: '1px solid var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', background: 'var(--surface-1)' }}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-sm font-semibold text-brand-500" style={{ textDecoration: 'none' }}>
            Sunrise Academy
          </Link>
          <span className="text-muted text-xs">/</span>
          <span className="text-xs font-medium truncate max-w-sm" style={{ color: 'var(--text-secondary)' }}>
            {course.title}
          </span>
        </div>
        <Link href="/dashboard" className="text-xs text-muted hover:underline">
          Exit Course
        </Link>
      </header>

      {/* Main Container */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        
        {/* Left Side: Video Player & Description */}
        <div className="flex-1 p-4 lg:p-8 overflow-y-auto flex flex-col gap-6">
          
          {/* Error Message */}
          {error && <div className="alert-error">{error}</div>}

          {/* HTML5 Player */}
          <div style={{ background: '#000', borderRadius: '0.75rem', overflow: 'hidden', aspectRatio: '16/9', position: 'relative' }}>
            {videoUrl ? (
              <video 
                ref={videoRef}
                key={videoUrl}
                src={videoUrl} 
                controls 
                controlsList="nodownload"
                onContextMenu={e => e.preventDefault()}
                style={{ width: '100%', height: '100%' }}
                autoPlay
              />
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {error ? 'Could not load video.' : 'Loading video...'}
              </div>
            )}
          </div>

          {/* Details below Player */}
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-bold">{activeVideo.title}</h1>
              <p className="text-xs text-muted mt-1">
                Course: {course.title} &nbsp;|&nbsp; Duration: {formatDuration(activeVideo.duration)}
              </p>
            </div>

            {/* Offline download button */}
            <div className="flex gap-2 items-center">
              {offline ? (
                <span className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-green-500 bg-opacity-10" style={{ color: '#22c55e', background: 'rgba(34, 197, 94, 0.1)' }}>
                  ✓ Downloaded Offline
                </span>
              ) : (
                <button 
                  className="btn-primary text-xs px-4 py-2" 
                  onClick={handleDownloadOffline}
                  disabled={downloading}
                >
                  {downloading ? `Saving... ${downloadProgress}%` : '↓ Save for Offline'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Playlist Sidebar */}
        <div className="w-full lg:w-[300px] lg:border-l border-t lg:border-t-0 border-surface-2 bg-surface-1 overflow-y-auto py-5 shrink-0">
          <h3 className="px-4 text-xs font-bold text-muted uppercase tracking-wider mb-3">
            Course Videos
          </h3>
          
          <div className="flex flex-col">
            {sortedVideos.map((v) => {
              const isActive = v.id === videoId;
              return (
                <Link 
                  key={v.id} 
                  href={`/watch/${courseId}/${v.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div 
                    style={{ 
                      padding: '0.875rem 1.25rem',
                      background: isActive ? 'rgba(245,158,11,0.08)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--brand-500)' : '3px solid transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s'
                    }}
                    className="hover:bg-surface-2"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span className="text-xs text-muted font-medium">{v.order}.</span>
                      <h4 
                        className="text-xs font-semibold truncate"
                        style={{ color: isActive ? 'var(--brand-400)' : 'var(--text-primary)' }}
                      >
                        {v.title}
                      </h4>
                    </div>
                    <div className="flex justify-between text-xxs text-muted pl-4">
                      <span>⏱ {formatDuration(v.duration)}</span>
                      {isVideoDownloaded(v.id) && <span style={{ color: '#22c55e' }}>✓ Offline</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
