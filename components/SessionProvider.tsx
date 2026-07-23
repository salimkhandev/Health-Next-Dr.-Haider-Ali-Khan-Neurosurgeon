// SessionProvider must live in a client component — this wrapper lets the
// root server layout include it without becoming a client component itself.
'use client';

import { SessionProvider } from 'next-auth/react';

export default function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
