import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import PasswordReset from '@/lib/models/PasswordReset';
import { sendPasswordResetEmail } from '@/lib/email';

import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const limitCheck = rateLimit(req, 3, 60000);
  if (!limitCheck.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: limitCheck.headers }
    );
  }

  const { email } = (await req.json()) ?? {};

  // Always return the same message — never leak whether the email is registered
  const genericResponse = NextResponse.json({
    message: 'If that email exists, a reset link has been sent.',
  });

  if (!email) return genericResponse;

  await connectDB();

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return genericResponse; // don't reveal non-existence

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await PasswordReset.create({ userId: user._id, token, expiresAt });

  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password/${token}`;
  // Fire-and-forget — email failure must not block this response
  void sendPasswordResetEmail(user.email, resetUrl);

  return genericResponse;
}
