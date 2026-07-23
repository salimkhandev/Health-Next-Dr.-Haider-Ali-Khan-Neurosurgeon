// Extend next-auth session and JWT types to include role, status, and id
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: 'student' | 'admin';
      status: string;
      accessExpiresAt: string | null;
    };
  }

  interface User {
    id: string;
    role: 'student' | 'admin';
    status: string;
    accessExpiresAt: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'student' | 'admin';
    status: string;
    accessExpiresAt: string | null;
  }
}
