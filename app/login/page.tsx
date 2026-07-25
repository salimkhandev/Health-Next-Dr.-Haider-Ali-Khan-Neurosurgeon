'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaUserMd, FaLock } from 'react-icons/fa';
import { FiLoader } from 'react-icons/fi';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.ok) {
      router.push('/dashboard');
    } else {
      setError('Invalid email or password.');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Top branding strip */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-8 pt-8 pb-6 text-white text-center relative">
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='0.3'%3E%3Cpath d='M0 20h40M20 0v40' stroke='%23fff' stroke-width='0.5'/%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
            <p className="text-blue-200 text-xs font-bold tracking-[0.25em] uppercase mb-1 relative">Neurosurgery Practice</p>
            <h1 className="text-2xl font-extrabold tracking-tight relative">Health Next</h1>
            <p className="text-blue-200 text-xs mt-1 relative">Dr. Haider Ali Khan · Neurosurgeon</p>
          </div>

          {/* Doctor info */}
          <div className="flex flex-col items-center -mt-10 px-8 pt-0 pb-2 relative z-10">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-200">
              <Image
                src="/DR-IMAGE.png"
                alt="Dr. Haider Ali Khan"
                fill
                className="object-cover object-top"
                priority
              />
            </div>
            <h2 className="mt-3 text-base font-bold text-slate-800">Dr. Haider Ali Khan</h2>
            <p className="text-xs text-blue-600 font-semibold">Neurosurgeon</p>
            <p className="text-[11px] text-slate-400 text-center mt-0.5 max-w-xs">
              MBBS, FCPS (Neurosurgery), Fellowship Endoscopic Neurosurgery, CHPE, Arab Spine Diploma
            </p>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="px-8 pb-8 pt-4 space-y-4">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center font-medium">
                {error}
              </div>
            )}
            <div className="field-group">
              <label className="label" htmlFor="email">Email</label>
              <div className="relative flex items-center">
                <FaUserMd className="absolute left-3.5 text-slate-400 text-base pointer-events-none z-10" />
                <input
                  id="email"
                  className="input pl-10"
                  type="email"
                  placeholder="doctor@healthnext.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="field-group">
              <label className="label" htmlFor="password">Password</label>
              <div className="relative flex items-center">
                <FaLock className="absolute left-3.5 text-slate-400 text-base pointer-events-none z-10" />
                <input
                  id="password"
                  className="input pl-10"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-base mt-2"
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-4">
          Health Next v1.0 &copy; 2026 · Private Clinical System
        </p>
      </div>
    </div>
  );
}
