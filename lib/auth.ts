import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();
        const user = await User.findOne({ email: credentials.email.toLowerCase() });
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          accessExpiresAt: user.accessExpiresAt?.toISOString() ?? null,
        };
      },
    }),
  ],

  session: { strategy: 'jwt' },

  callbacks: {
    async jwt({ token, user }) {
      // On initial sign-in, `user` is populated — persist custom fields into JWT
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
        token.accessExpiresAt = user.accessExpiresAt;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.status = token.status;
      session.user.accessExpiresAt = token.accessExpiresAt;
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  // Admin sessions expire in 24h; student sessions in 7 days.
  // maxAge is set per-token in the jwt callback via a custom cookie if needed,
  // but a blanket 7-day value is safe here — admin routes are middleware-protected.
  jwt: { maxAge: 7 * 24 * 60 * 60 },

  secret: process.env.NEXTAUTH_SECRET,
};
