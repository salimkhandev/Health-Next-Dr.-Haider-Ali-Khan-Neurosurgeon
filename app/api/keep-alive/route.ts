import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    // Ping the MongoDB deployment to confirm the connection is alive
    await mongoose.connection.db!.command({ ping: 1 });
    return Response.json({ status: 'ok', db: 'connected' }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return Response.json({ status: 'error', db: message }, { status: 500 });
  }
}
