// Using native node --env-file flag
const { S3Client, PutBucketCorsCommand } = require('@aws-sdk/client-s3');

function extractRegion(endpoint) {
  const b2Match = endpoint.match(/s3\.([^.]+)\.backblaze(b2|storage)\.com/);
  if (b2Match) return b2Match[1];
  return 'auto';
}

async function setCors() {
  const endpoint = process.env.R2_ENDPOINT;
  const client = new S3Client({
    region: extractRegion(endpoint),
    endpoint,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
    forcePathStyle: false,
  });

  const command = new PutBucketCorsCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
          AllowedOrigins: ['*'], // Allow all origins for dev
          ExposeHeaders: ['ETag'],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  });

  try {
    await client.send(command);
    console.log('✅ CORS rules successfully updated via S3 SDK!');
  } catch (err) {
    console.error('❌ Failed to update CORS:', err);
  }
}

setCors();
