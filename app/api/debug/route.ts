import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import Payment from '@/lib/models/Payment';
import Course from '@/lib/models/Course';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email') || 'salimkhandev12@gmail.com';

  await connectDB();
  
  const user = await User.findOne({ email }).lean();
  const payments = await Payment.find({ email }).lean();

  // Check if the enrolled courses actually exist
  const enrolledIds = (user as any)?.enrolledCourseIds ?? [];
  const courses = await Course.find({ _id: { $in: enrolledIds } }).lean();
  const allCourses = await Course.find({}).select('_id title').lean();

  return NextResponse.json({
    user,
    payments,
    enrolledCourses: courses,
    allCoursesInDb: allCourses,
  });
}
