import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import AuthSessionProvider from '@/components/SessionProvider';
import ServiceWorker from '@/components/ServiceWorker';
import PWAInstallButton from '@/components/PWAInstallButton';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

export const metadata: Metadata = {
  title: 'Sunrise English Language & Skills Academy',
  description:
    'Learn English language and communication skills with Hafiz Mujeeb at Sunrise English Language & Skills Academy.',
  manifest: '/manifest',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0f172a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Sunrise Academy" />
      </head>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 antialiased">
        <AuthSessionProvider>{children}</AuthSessionProvider>
        <ServiceWorker />
        <PWAInstallButton />
      </body>
    </html>
  );
}
