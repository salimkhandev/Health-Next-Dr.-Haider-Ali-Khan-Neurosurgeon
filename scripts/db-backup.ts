import { connectDB } from '../lib/db';
import Course from '../lib/models/Course';
import User from '../lib/models/User';
import Payment from '../lib/models/Payment';
import Progress from '../lib/models/Progress';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const BUCKET = process.env.R2_BUCKET_NAME!;

async function runBackup() {
  console.log('[Backup] Starting database serialization...');
  
  await connectDB();

  // 1. Fetch all documents from key collections
  const users = await User.find({}).lean();
  const courses = await Course.find({}).lean();
  const payments = await Payment.find({}).lean();
  const progress = await Progress.find({}).lean();

  const backupData = {
    metadata: {
      timestamp: new Date().toISOString(),
      version: '1.0',
    },
    collections: {
      users,
      courses,
      payments,
      progress,
    },
  };

  const jsonString = JSON.stringify(backupData, null, 2);
  const buffer = Buffer.from(jsonString, 'utf-8');

  // 2. Build S3 target key
  const timestamp = Date.now();
  const prefix = process.env.R2_KEY_PREFIX ?? '';
  const key = `${prefix}backups/db-backup-${timestamp}.json`;

  console.log(`[Backup] Serialization complete. Uploading ${buffer.length} bytes to R2: ${key}...`);

  // 3. Upload directly to Cloudflare R2
  const client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'application/json',
    })
  );

  console.log('[Backup] Backup successfully uploaded to R2.');
}

runBackup()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('[Backup] Critical backup failed:', err);
    process.exit(1);
  });
