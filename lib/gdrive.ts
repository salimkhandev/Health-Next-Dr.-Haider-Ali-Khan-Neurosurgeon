import { google, drive_v3 } from 'googleapis';

let _driveClient: drive_v3.Drive | null = null;

function getDriveClient(): drive_v3.Drive {
  if (!_driveClient) {
    let auth: any;

    if (process.env.GOOGLE_DRIVE_REFRESH_TOKEN && process.env.GOOGLE_DRIVE_CLIENT_ID && process.env.GOOGLE_DRIVE_CLIENT_SECRET) {
      // Use OAuth2 with Refresh Token (Uploads act as the real user, using their full storage quota)
      auth = new google.auth.OAuth2(
        process.env.GOOGLE_DRIVE_CLIENT_ID,
        process.env.GOOGLE_DRIVE_CLIENT_SECRET
      );
      auth.setCredentials({ refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN });
    } else if (process.env.GOOGLE_DRIVE_CLIENT_EMAIL && process.env.GOOGLE_DRIVE_PRIVATE_KEY) {
      // Use Service Account (Warning: SAs often have zero storage quota on free tier)
      auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_DRIVE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
    } else {
      throw new Error('Google Drive credentials are not configured.');
    }

    _driveClient = google.drive({ version: 'v3', auth });
  }
  return _driveClient;
}

/**
 * Creates a resumable upload session for large files directly from the browser.
 * Returns the session URI to which the client can PUT chunks.
 */
export async function createResumableUploadSession(
  filename: string,
  mimeType: string,
  folderId: string,
  origin: string = process.env.NEXTAUTH_URL || 'https://sunrise-english-language-and-skill.onrender.com'
): Promise<{ uploadUrl: string; fileId?: string }> {
  const drive = getDriveClient();
  
  // We use the direct fetch approach to get the Location header for resumable upload
  const auth = drive.context._options.auth as any;
  const tokenResponse = await auth.getAccessToken();
  const token = typeof tokenResponse === 'object' && tokenResponse !== null ? tokenResponse.token : tokenResponse;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Upload-Content-Type': mimeType,
      'Content-Type': 'application/json; charset=UTF-8',
      'Origin': origin,
    },
    body: JSON.stringify({
      name: filename,
      parents: [folderId],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to create upload session: ${res.status} ${errText}`);
  }

  const uploadUrl = res.headers.get('location');
  if (!uploadUrl) {
    throw new Error('Location header missing in resumable session response');
  }

  return { uploadUrl };
}

/**
 * Stream a Drive file using native fetch — returns a raw Response whose .body
 * is already a Web ReadableStream. This is the correct approach for the
 * Next.js App Router: no Node.js Readable conversion, no buffering.
 */
export async function getDriveStreamResponse(
  fileId: string,
  rangeHeader: string | null
): Promise<Response> {
  const drive = getDriveClient();
  // Reuse the auth client from the googleapis instance to get a fresh token
  const auth = (drive.context._options as any).auth;
  const tokenResponse = await auth.getAccessToken();
  const token =
    typeof tokenResponse === 'object' && tokenResponse !== null
      ? tokenResponse.token
      : tokenResponse;

  const reqHeaders: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (rangeHeader) {
    reqHeaders['Range'] = rangeHeader;
  }

  return fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: reqHeaders }
  );
}

/**
 * Returns a fresh short-lived OAuth2 access token for the Drive auth client.
 * Used to build a direct browser-to-Drive download URL (no Vercel proxy needed).
 */
export async function getDriveAccessToken(): Promise<string> {
  const drive = getDriveClient();
  const auth = (drive.context._options as any).auth;
  const tokenResponse = await auth.getAccessToken();
  return typeof tokenResponse === 'object' && tokenResponse !== null
    ? tokenResponse.token
    : tokenResponse;
}

export async function getDriveFileMetadata(fileId: string) {
  const drive = getDriveClient();
  const res = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size',
  });
  return res.data;
}

/**
 * Make a file publicly readable and return its CDN thumbnail link.
 */
export async function makeFilePublicAndGetThumbnail(fileId: string): Promise<string | null | undefined> {
  const drive = getDriveClient();
  
  await drive.permissions.create({
    fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  const res = await drive.files.get({
    fileId,
    fields: 'thumbnailLink',
  });

  // the returned link often has =s220 or similar, we can replace to get higher res
  let url = res.data.thumbnailLink;
  if (url) {
    url = url.replace(/=s\d+$/, '=s800');
  }
  return url;
}

/**
 * Deletes a file from Drive.
 */
export async function deleteDriveFile(fileId: string) {
  const drive = getDriveClient();
  try {
    await drive.files.delete({ fileId });
  } catch (err: any) {
    if (err.status !== 404) {
      console.error(`Failed to delete drive file ${fileId}:`, err);
      throw err;
    }
  }
}

export const DRIVE_FOLDERS = {
  VIDEOS: process.env.GOOGLE_DRIVE_VIDEOS_FOLDER_ID || '',
  THUMBNAILS: process.env.GOOGLE_DRIVE_THUMBNAILS_FOLDER_ID || '',
  RECEIPTS: process.env.GOOGLE_DRIVE_RECEIPTS_FOLDER_ID || '',
};
