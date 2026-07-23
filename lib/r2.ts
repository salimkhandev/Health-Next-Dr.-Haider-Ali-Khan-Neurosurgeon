import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Singleton S3 client — compatible with both Cloudflare R2 and Backblaze B2
let _client: S3Client | null = null;

/**
 * Extract the region from a B2/R2 endpoint URL.
 * B2 endpoint: https://s3.us-west-004.backblazestorage.com → region = us-west-004
 * R2 endpoint: https://<id>.r2.cloudflarestorage.com        → region = auto
 */
function extractRegion(endpoint: string): string {
  const b2Match = endpoint.match(/s3\.([^.]+)\.backblaze(b2|storage)\.com/);
  if (b2Match) return b2Match[1];
  return 'auto';
}

function getClient(): S3Client {
  if (!_client) {
    const endpoint = process.env.R2_ENDPOINT!;
    _client = new S3Client({
      region: extractRegion(endpoint),
      endpoint,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
      // B2 doesn't support AWS SDK v3's automatic CRC32 checksums
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
      // Use path-style so the bucket name stays in the path, not the subdomain
      forcePathStyle: false,
    });
  }
  return _client;
}

const BUCKET = process.env.R2_BUCKET_NAME!;
// In dev, all keys are prefixed with "dev/" so they're visually isolated from prod
const PREFIX = process.env.R2_KEY_PREFIX ?? '';

/** Generate a presigned GET URL for a private B2/R2 object. */
export async function getPresignedGetUrl(key: string, expiresIn = 3600): Promise<string> {
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn }
  );
}

/** Generate a presigned PUT URL so the browser can upload directly to B2/R2. */
export async function getPresignedPutUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  return getSignedUrl(
    getClient(),
    new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }),
    { expiresIn }
  );
}

/** Apply the dev/prod key prefix. Call this before every key you build. */
export function r2Key(path: string): string {
  return `${PREFIX}${path}`;
}
