import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { db, users } from './db';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: 'pending' | 'user' | 'admin';
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      // Check if user exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, user.email),
      });

      if (existingUser) {
        return true;
      }

      // Create new user
      const isAdmin = user.email === process.env.ADMIN_EMAIL;
      const userId = nanoid();

      await db.insert(users).values({
        id: userId,
        email: user.email,
        name: user.name,
        image: user.image,
        role: isAdmin ? 'admin' : 'pending',
        approvedAt: isAdmin ? new Date() : null,
      });

      return true;
    },
    async session({ session, token }) {
      if (!session.user.email) return session;

      const dbUser = await db.query.users.findFirst({
        where: eq(users.email, session.user.email),
      });

      if (dbUser) {
        session.user.id = dbUser.id;
        session.user.role = dbUser.role as 'pending' | 'user' | 'admin';
      } else {
        session.user.role = 'pending';
      }

      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: 'jwt',
  },
});

export async function getUser() {
  const session = await auth();
  return session?.user;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireApprovedUser() {
  const user = await requireAuth();
  if (user.role === 'pending') {
    throw new Error('Pending approval');
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== 'admin') {
    throw new Error('Admin required');
  }
  return user;
}
