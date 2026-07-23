import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import OfflineAwareHome from '@/components/OfflineAwareHome';
import { Lock, Download, GraduationCap, Smartphone, Mail, Phone, MapPin, MessageSquare } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sunrise English Language and Skills Academy',
  description:
    'Learn English language and communication skills with Hafiz Mujeeb. Stream or watch offline anytime.',
};

const FEATURES = [
  {
    icon: <Download className="w-10 h-10 text-amber-500" />,
    title: 'Offline Video Access',
    desc: 'Download and save course videos directly to your device. Learn anytime without using your mobile data.',
  },
  {
    icon: <Lock className="w-10 h-10 text-amber-500" />,
    title: 'Secure Access',
    desc: 'Your learning account and purchased courses are private and safely secured to your device.',
  },
  {
    icon: <Smartphone className="w-10 h-10 text-amber-500" />,
    title: 'Multi-Device Support',
    desc: 'Access your coursework seamlessly on any phone, tablet, or computer right from the browser.',
  },
  {
    icon: <MessageSquare className="w-10 h-10 text-amber-500" />,
    title: 'Interactive AI Tutor',
    desc: 'Practice English conversation and get instant feedback with our built-in AI tutor.',
  },
];

export default function HomePage() {
  return (
    <OfflineAwareHome>
      <Navbar />

      {/* Hero Section */}
      <section className="min-h-[85vh] flex flex-col items-center justify-center text-center px-6 py-20 sm:px-8 lg:px-12 relative overflow-hidden">
        {/* Background glow */}
        <div
          aria-hidden
          className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[radial-gradient(ellipse,rgba(245,158,11,0.12)_0%,transparent_70%)] pointer-events-none"
        />

        <div className="relative max-w-4xl mx-auto">
          <span className="inline-block bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full px-4 py-1 text-xs font-semibold tracking-widest uppercase mb-7">
            Sunrise English Academy
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-slate-100 mb-6">
            Master English Language &{' '}
            <span className="text-amber-500">Communication Skills</span>
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto mb-10">
            Unlock professional opportunities and build global confidence. Learn online with experienced teacher <strong>Hafiz Mujeeb</strong>, stream lectures, or download and watch offline.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-amber-500 text-slate-950 font-bold text-base rounded-xl no-underline hover:bg-amber-600 transition-colors"
            >
              Browse Our Courses →
            </Link>
            <Link
              href="/tutor"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-500 text-slate-950 font-bold text-base rounded-xl no-underline hover:bg-brand-600 transition-colors shadow-lg hover:shadow-xl"
            >
              🤖 Practice with AI Tutor
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center px-8 py-3.5 bg-slate-900 border border-slate-700 text-slate-100 font-semibold text-base rounded-xl no-underline hover:border-slate-600 transition-colors"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* Instructor Section */}
      <section className="px-6 py-20 sm:px-8 lg:px-12 border-t border-slate-900 bg-slate-950/40">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-4 flex justify-center">
            <div className="w-48 h-48 rounded-full border-4 border-amber-500/30 overflow-hidden bg-slate-900 flex items-center justify-center">
              <Image 
                src="/profile.jpg" 
                alt="Hafiz Mujeeb ur Rahman" 
                width={192} 
                height={192} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="md:col-span-8 text-center md:text-left">
            <span className="text-amber-400 text-sm font-semibold uppercase tracking-wider">Meet Your Instructor</span>
            <h2 className="text-3xl font-extrabold text-slate-100 mt-2 mb-4">Hafiz Mujeeb ur Rahman</h2>
            <p className="text-slate-400 leading-relaxed mb-6">
              Dedicated educator committed to delivering premium quality English language training and professional skill sets. Hafiz Mujeeb conducts structured online courses designed for students, job seekers, and working professionals in Pakistan and globally.
            </p>
            <div className="flex gap-3 justify-center md:justify-start flex-wrap">
              <a
                href="https://wa.me/923425015034"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors no-underline"
              >
                <MessageSquare className="w-4 h-4" /> WhatsApp Support
              </a>
              <a
                href="https://web.facebook.com/people/Sunrise-English-Language-Skills-Academy/61580749476897/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors no-underline"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook Page
              </a>
              <a
                href="https://www.youtube.com/@HafizMujeeburRahman-y2d"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors no-underline"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.507 9.388.507 9.388.507s7.518 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                YouTube Channel
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 sm:px-8 lg:px-12 border-t border-slate-800 bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-2">
            App Features
          </h2>
          <p className="text-center text-slate-400 mb-14 text-base sm:text-lg">
            Practical modules optimized for internet conditions in Pakistan — low bandwidth, offline-friendly.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-7">
                <div className="mb-4">{f.icon}</div>
                <h3 className="font-semibold mb-2 text-base sm:text-lg">
                  {f.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Info and Social Links */}
      <section className="px-6 py-20 sm:px-8 lg:px-12 border-t border-slate-800 bg-slate-950/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-8">Get In Touch</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left mb-12">
            <div className="card p-6 flex flex-col gap-3">
              <div className="flex items-center gap-3 text-amber-500 font-semibold">
                <Phone className="w-5 h-5" /> Phone & WhatsApp
              </div>
              <p className="text-slate-300 text-sm flex flex-col gap-1">
                <a href="https://wa.me/923425015034" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors">0342-5015034</a>
                <a href="https://wa.me/923185263800" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors">0318-5263800</a>
              </p>
            </div>
            
            <div className="card p-6 flex flex-col gap-3">
              <div className="flex items-center gap-3 text-amber-500 font-semibold">
                <Mail className="w-5 h-5" /> Email Address
              </div>
              <p className="text-slate-300 text-sm">
                <a href="mailto:sunriseacademy1122@gmail.com" className="hover:text-amber-400 transition-colors">sunriseacademy1122@gmail.com</a>
              </p>
            </div>

            <div className="card p-6 flex flex-col gap-3">
              <div className="flex items-center gap-3 text-amber-500 font-semibold">
                <MapPin className="w-5 h-5" /> Location
              </div>
              <p className="text-slate-300 text-sm">
                <a href="https://maps.google.com/?q=Timergara,+Pakistan" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors">Timergara, Pakistan</a>
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-6 flex-wrap">
            <a
              href="https://web.facebook.com/people/Sunrise-English-Language-Skills-Academy/61580749476897/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-blue-500 transition-colors text-sm font-medium"
            >
              Facebook Profile
            </a>
            <span className="text-slate-700">•</span>
            <a
              href="https://tiktok.com/@sunriseacademe1133"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-pink-500 transition-colors text-sm font-medium"
            >
              TikTok
            </a>
            <span className="text-slate-700">•</span>
            <a
              href="https://www.youtube.com/@HafizMujeeburRahman-y2d"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-red-500 transition-colors text-sm font-medium"
            >
              YouTube
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 sm:px-8 lg:px-12 text-center border-t border-slate-800 bg-slate-900/60">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            Ready to Speak Fluent English?
          </h2>
          <p className="text-slate-400 mb-8 text-base sm:text-lg">
            Create an account, enroll in our premium training, and unlock interactive video courses.
          </p>
          <Link
            href="/register"
            className="inline-flex px-10 py-3.5 bg-amber-500 text-slate-950 font-bold text-base rounded-xl no-underline hover:bg-amber-600 transition-colors"
          >
            Get Started Online
          </Link>
        </div>
      </section>

      <Footer />
    </OfflineAwareHome>
  );
}
