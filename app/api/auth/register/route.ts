import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';

import { rateLimit } from '@/lib/rate-limit';

// Password rule: min 8 chars, at least 1 letter and 1 number
function isValidPassword(password: string): boolean {
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
}

export async function POST(req: NextRequest) {
  const limitCheck = rateLimit(req, 5, 60000);
  if (!limitCheck.success) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Please try again later.' },
      { status: 429, headers: limitCheck.headers }
    );
  }

  const body = await req.json();
  const { name, email, password } = body ?? {};

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
  }

  if (!isValidPassword(password)) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters with at least 1 letter and 1 number.' },
      { status: 400 }
    );
  }

  await connectDB();

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    role: 'student',   // register always creates students — admins are seeded manually
    status: 'pending',
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
