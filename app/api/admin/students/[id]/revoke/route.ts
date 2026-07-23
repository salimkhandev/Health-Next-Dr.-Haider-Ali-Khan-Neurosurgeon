import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';

export async function POST(
  req: NextRequest,
  ctx: RouteContext<'/api/admin/students/[id]/revoke'>
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;

  await connectDB();
  const user = await User.findById(id);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  user.status = 'revoked';
  await user.save();

  return NextResponse.json({ success: true });
}
