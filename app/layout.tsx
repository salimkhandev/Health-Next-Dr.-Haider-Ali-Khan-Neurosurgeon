import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  metadataBase: new URL('https://dr-haider-ali-khan-neurosurgeon.vercel.app'),
  title: 'NitroClinic — Health Next · Dr. Haider Ali Khan',
  description:
    'AI-Assisted Patient Management & Ward Management System for Dr. Haider Ali Khan, Neurosurgeon at Health Next.',
  robots: 'noindex,nofollow', // private clinical system
  openGraph: {
    title: 'NitroClinic — Health Next',
    description: 'Neurosurgery Practice Management & Clinical Suite',
    url: 'https://dr-haider-ali-khan-neurosurgeon.vercel.app',
    siteName: 'NitroClinic',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
