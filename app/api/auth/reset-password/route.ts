import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import PasswordReset from '@/lib/models/PasswordReset';

import { rateLimit } from '@/lib/rate-limit';

function isValidPassword(password: string): boolean {
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
}

export async function POST(req: NextRequest) {
  const limitCheck = rateLimit(req, 5, 60000);
  if (!limitCheck.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: limitCheck.headers }
    );
  }

  const { token, password } = (await req.json()) ?? {};

  if (!token || !password) {
    return NextResponse.json({ error: 'Token and new password are required.' }, { status: 400 });
  }

  if (!isValidPassword(password)) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters with at least 1 letter and 1 number.' },
      { status: 400 }
    );
  }

  await connectDB();

  const resetDoc = await PasswordReset.findOne({ token });

  if (!resetDoc) {
    return NextResponse.json({ error: 'Invalid or expired reset link.' }, { status: 400 });
  }

  if (resetDoc.used) {
    return NextResponse.json(
      { error: 'This reset link has already been used. Please request a new one.' },
      { status: 400 }
    );
  }

  if (resetDoc.expiresAt < new Date()) {
    return NextResponse.json(
      { error: 'This reset link has expired. Please request a new one.' },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.findByIdAndUpdate(resetDoc.userId, { passwordHash });
  await PasswordReset.findByIdAndUpdate(resetDoc._id, { used: true });

  return NextResponse.json({ success: true });
}
