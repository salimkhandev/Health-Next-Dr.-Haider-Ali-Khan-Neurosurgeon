/**
 * Origin Private File System (OPFS) helper for managing offline course video files.
 */

interface OfflineVideo {
  videoId: string;
  courseId: string;
  courseTitle: string;
  videoTitle: string;
  filename: string;
  sizeBytes: number;
  downloadedAt: Date;
}

const META_KEY = 'ilmpath_offline_metadata';

function getMetadataList(): OfflineVideo[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMetadataList(list: OfflineVideo[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(META_KEY, JSON.stringify(list));
}

/** Check if a video is downloaded and available offline */
export function isVideoDownloaded(videoId: string): boolean {
  return getMetadataList().some((v) => v.videoId === videoId);
}

/** Get list of all offline videos */
export function getOfflineVideos(): OfflineVideo[] {
  return getMetadataList();
}

/** Download video file into OPFS chunk-by-chunk */
export async function downloadVideoToOPFS(
  videoId: string,
  courseId: string,
  courseTitle: string,
  videoTitle: string,
  downloadUrl: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  const root = await navigator.storage.getDirectory();
  
  // Save files as videoId.mp4 to keep it clean and collision-free
  const filename = `${videoId}.mp4`;
  const fileHandle = await root.getFileHandle(filename, { create: true });
  
  const response = await fetch(downloadUrl);
  if (!response.ok) throw new Error('Failed to download video file.');
  if (!response.body) throw new Error('Response body is empty.');

  const contentLength = Number(response.headers.get('content-length') ?? 0);
  const reader = response.body.getReader();
  const writable = await (fileHandle as any).createWritable();

  let receivedLength = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      await writable.write(value);
      receivedLength += value.length;
      
      if (contentLength && onProgress) {
        onProgress(Math.round((receivedLength / contentLength) * 100));
      }
    }
  } finally {
    await writable.close();
  }

  // Update metadata list
  const list = getMetadataList();
  const updatedList = list.filter((v) => v.videoId !== videoId);
  updatedList.push({
    videoId,
    courseId,
    courseTitle,
    videoTitle,
    filename,
    sizeBytes: receivedLength || contentLength,
    downloadedAt: new Date(),
  });
  saveMetadataList(updatedList);
}

/** Get a playable Object URL for an offline video from OPFS */
export async function getOfflineVideoUrl(videoId: string): Promise<string> {
  const root = await navigator.storage.getDirectory();
  const filename = `${videoId}.mp4`;
  try {
    const fileHandle = await root.getFileHandle(filename);
    const file = await fileHandle.getFile();
    return URL.createObjectURL(file);
  } catch {
    // File handle not found — metadata may be stale; clean it up
    const list = getMetadataList();
    saveMetadataList(list.filter((v) => v.videoId !== videoId));
    throw new Error(`Offline video not found in storage: ${videoId}`);
  }
}

/** Revoke an Object URL created by getOfflineVideoUrl to free memory */
export function revokeOfflineVideoUrl(url: string): void {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
}

/** Delete a video file from OPFS and clean up metadata */
export async function deleteOfflineVideo(videoId: string): Promise<void> {
  const root = await navigator.storage.getDirectory();
  const filename = `${videoId}.mp4`;
  try {
    await root.removeEntry(filename);
  } catch (err) {
    console.error('File entry not found in OPFS during deletion', err);
  }

  const list = getMetadataList();
  saveMetadataList(list.filter((v) => v.videoId !== videoId));
}
