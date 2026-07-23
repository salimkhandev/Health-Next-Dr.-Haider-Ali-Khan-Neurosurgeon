import Link from 'next/link';
import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Course from '@/lib/models/Course';
import { getPresignedGetUrl } from '@/lib/r2';
import { Video, Clock, Lock as LockIcon } from 'lucide-react';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return { title: 'Course Not Found' };
  await connectDB();
  const course = await Course.findById(id, { title: 1, description: 1 }).lean();
  if (!course) return { title: 'Course Not Found' };
  return { title: `${course.title} — Sunrise Academy`, description: course.description };
}

export default async function CourseDetailPage({ params }: Props) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) notFound();

  await connectDB();
  const course = await Course.findById(id).lean();
  if (!course) notFound();

  const thumbnailUrl = course.thumbnailKey
    ? await getPresignedGetUrl(course.thumbnailKey, 3600)
    : null;

  const videos = [...course.videos].sort((a, b) => a.order - b.order);
  const totalDuration = videos.reduce((a, v) => a + v.duration, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/courses"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 no-underline mb-8 hover:text-slate-400 transition-colors"
      >
        ← All courses
      </Link>

      {/* Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-start mb-12">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl lg:text-4xl mb-4 leading-tight">
            {course.title}
          </h1>
          <p className="text-slate-400 leading-relaxed mb-6">
            {course.description}
          </p>
          <div className="flex gap-6 text-slate-500 text-sm mb-8">
            <span className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              {videos.length} videos
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {formatDuration(totalDuration)} total
            </span>
          </div>
          <Link
            href="/register"
            className="inline-flex px-7 py-3 bg-amber-500 text-slate-950 font-bold rounded-lg no-underline text-base hover:bg-amber-600 transition-colors"
          >
            Enroll — create free account
          </Link>
        </div>

        {thumbnailUrl && (
          <div className="w-full lg:w-56 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnailUrl}
              alt={course.title}
              className="w-full rounded-lg border border-slate-700"
            />
          </div>
        )}
      </div>

      {/* Video list */}
      <h2 className="text-xl font-semibold mb-4">
        Course Content
      </h2>
      <div className="border border-slate-700 rounded-lg overflow-hidden">
        {videos.map((video, i) => (
          <div
            key={video._id.toString()}
            className={`flex items-center gap-4 px-5 py-3.5 bg-slate-900 ${
              i < videos.length - 1 ? 'border-b border-slate-700' : ''
            }`}
          >
            <span className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-500 flex-shrink-0 font-semibold">
              {video.order}
            </span>
            <span className="flex-1 text-sm text-slate-100">
              {video.title}
            </span>
            <span className="text-xs text-slate-500 flex-shrink-0">
              {formatDuration(video.duration)}
            </span>
            <LockIcon className="w-4 h-4 text-slate-500" />
          </div>
        ))}
      </div>
    </div>
  );
}
