import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import Payment from '@/lib/models/Payment';
import User from '@/lib/models/User';

export async function POST(req: Request) {
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['pending', 'rejected'].includes(token.status as string)) {
    return NextResponse.json({ error: 'Not eligible to submit payment.' }, { status: 403 });
  }

  const body = await req.json();
  const { amount, paymentMethod, screenshotKey, driveFileId, courseId } = body;

  if (!amount || !paymentMethod || (!screenshotKey && !driveFileId) || !courseId) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
  }

  await connectDB();

  // Create payment record
  await Payment.create({
    userId: token.id,
    courseId,
    name: token.name ?? '',
    email: token.email ?? '',
    amount: Number(amount),
    paymentMethod,
    screenshotKey: screenshotKey || '',
    driveFileId,
    status: 'pending',
  });

  // Update user status to pending so they can't submit again
  await User.findByIdAndUpdate(token.id, { status: 'pending' });

  return NextResponse.json({ success: true });
}
