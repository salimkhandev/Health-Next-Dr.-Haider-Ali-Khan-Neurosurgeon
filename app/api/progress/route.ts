import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import Progress from '@/lib/models/Progress';
import Course from '@/lib/models/Course';
import { sendCertificateReady } from '@/lib/email';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { courseId, videoId, progressPercent, secondsWatched } = await req.json();

  if (!courseId || !videoId || typeof secondsWatched !== 'number') {
    return NextResponse.json({ error: 'Invalid parameters.' }, { status: 400 });
  }

  await connectDB();

  // Find course to get video duration
  const course = await Course.findById(courseId).lean();
  if (!course) return NextResponse.json({ error: 'Course not found.' }, { status: 404 });

  const video = course.videos.find((v) => v._id.toString() === videoId);
  if (!video) return NextResponse.json({ error: 'Video not found in course.' }, { status: 404 });

  // Mark completed if watched >= 90% of duration
  const isCompleted = secondsWatched >= video.duration * 0.9;

  // Upsert progress
  await Progress.findOneAndUpdate(
    { userId: token.id, courseId, videoId },
    { 
      watchedSeconds: secondsWatched,
      completed: isCompleted,
    },
    { upsert: true, returnDocument: 'after' }
  );

  // Check if course is now 100% complete
  const allVideos = course.videos;
  const completedProgress = await Progress.find({
    userId: token.id,
    courseId,
    completed: true,
  }).lean();

  const isCourseComplete = allVideos.every((v) =>
    completedProgress.some((p) => p.videoId.toString() === v._id.toString())
  );

  if (isCourseComplete) {
    // Send completion email (fire-and-forget stub)
    const baseUrl = process.env.NEXTAUTH_URL ?? 'https://sunrise-english-language-and-skill.onrender.com';
    sendCertificateReady(
      token.email ?? '',
      course.title,
      `${baseUrl}/certificate/${courseId}`
    ).catch(console.error);
  }

  return NextResponse.json({ success: true, completed: isCompleted, courseCompleted: isCourseComplete });
}
