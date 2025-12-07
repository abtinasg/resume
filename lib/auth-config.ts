import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { userService } from '@/lib/db/user';

export const authOptions: NextAuthOptions = {
  // Use JWT strategy - no database sessions
  session: {
    strategy: 'jwt',
  },

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Verify password
        const isValid = await userService.verifyPassword(
          credentials.email,
          credentials.password
        );

        if (!isValid) {
          return null;
        }

        // Get user
        const user = await userService.findByEmail(credentials.email);

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      }
    })
  ],

  callbacks: {
    // Add user.id to JWT token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    // Add user.id to session
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },

  secret: process.env.NEXTAUTH_SECRET,
};
