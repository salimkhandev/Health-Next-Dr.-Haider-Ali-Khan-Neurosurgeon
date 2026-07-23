/**
 * One-time setup script — run locally with:
 *   npx ts-node --project tsconfig.json lib/db-indexes.ts
 *
 * Creates all MongoDB indexes defined in the spec (§4).
 * Safe to re-run; createIndex is idempotent.
 */
import mongoose from 'mongoose';

async function createIndexes() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');

  await mongoose.connect(uri);
  const db = mongoose.connection.db!;

  // users
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('users').createIndex({ status: 1 });

  // payments — compound index supports sorting latest per user efficiently
  await db.collection('payments').createIndex({ userId: 1, submittedAt: -1 });
  await db.collection('payments').createIndex({ status: 1 });

  // passwordResets
  await db.collection('passwordresets').createIndex({ token: 1 }, { unique: true });
  // TTL: MongoDB deletes docs automatically when expiresAt is in the past
  await db.collection('passwordresets').createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
  );

  // progress — unique compound ensures one doc per (user, course, video)
  await db.collection('progresses').createIndex(
    { userId: 1, courseId: 1, videoId: 1 },
    { unique: true }
  );

  console.log('All indexes created successfully.');
  await mongoose.disconnect();
}

createIndexes().catch((err) => {
  console.error(err);
  process.exit(1);
});
