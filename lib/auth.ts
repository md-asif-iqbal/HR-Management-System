import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import dbConnect from '@/lib/db';
import User from '@/models/User';

async function generateNextEmployeeId(): Promise<string> {
  const records = await User.find({ employeeId: { $regex: /^EMP-\d+$/ } })
    .select('employeeId')
    .lean();

  const maxNumber = records.reduce((max, record: any) => {
    const value = String(record.employeeId || '');
    const match = value.match(/^EMP-(\d+)$/);
    if (!match) return max;
    const current = parseInt(match[1], 10);
    return Number.isFinite(current) && current > max ? current : max;
  }, 0);

  return `EMP-${String(maxNumber + 1).padStart(3, '0')}`;
}

export const authOptions: NextAuthOptions = {
  providers: [
    // ── Email / Password (MongoDB + bcrypt) ───────────────────────────────
    CredentialsProvider({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        await dbConnect();

        const user = await User.findOne({ email: credentials.email.toLowerCase() })
          .select('+password')
          .lean();

        if (!user) throw new Error('No account found with this email');

        if (user.status === 'inactive' || user.status === 'terminated' || user.status === 'resigned') {
          throw new Error('Your account has been deactivated');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) throw new Error('Incorrect password');

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          employeeId: user.employeeId,
          avatar: user.avatar?.url || '',
        };
      },
    }),

    // ── Google via Firebase ID token ──────────────────────────────────────
    CredentialsProvider({
      id: 'google-firebase',
      name: 'Google',
      credentials: {
        idToken: { label: 'Firebase ID Token', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.idToken) throw new Error('No ID token provided');

        const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
        if (!firebaseApiKey) {
          throw new Error('Firebase configuration missing');
        }

        const res = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: credentials.idToken }),
          }
        );

        if (!res.ok) throw new Error('Invalid Google token');

        const tokenData = await res.json();
        const email = tokenData?.users?.[0]?.email?.toLowerCase();
        const displayName = tokenData?.users?.[0]?.displayName || email?.split('@')[0] || 'User';
        if (!email) throw new Error('No email returned from Google');

        await dbConnect();

        let user = await User.findOne({ email });

        if (!user) {
          const adminEmails = (process.env.GOOGLE_ADMIN_EMAILS || '')
            .split(',')
            .map((item) => item.trim().toLowerCase())
            .filter(Boolean);

          const role = adminEmails.includes(email) ? 'hr' : 'employee';
          const randomPassword = await bcrypt.hash(randomBytes(24).toString('hex'), 12);

          let createdUser: any = null;

          for (let attempt = 0; attempt < 5; attempt++) {
            const employeeId = await generateNextEmployeeId();

            try {
              createdUser = await User.create({
                employeeId,
                name: displayName,
                email,
                password: randomPassword,
                role,
                status: 'active',
                employmentType: 'full-time',
                joiningDate: new Date(),
                totalLeaves: role === 'hr' ? 15 : 12,
                usedLeaves: 0,
              });
              break;
            } catch (createError: any) {
              if (createError?.code === 11000 && createError?.keyPattern?.email) {
                createdUser = await User.findOne({ email });
                break;
              }

              if (createError?.code === 11000 && createError?.keyPattern?.employeeId) {
                continue;
              }

              throw createError;
            }
          }

          if (!createdUser) {
            throw new Error('Failed to create user. Please try again.');
          }

          user = createdUser;
        }

        if (!user) {
          throw new Error('Authentication failed. Please try again.');
        }

        if (user.status === 'inactive' || user.status === 'terminated' || user.status === 'resigned') {
          throw new Error('Your account has been deactivated');
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          employeeId: user.employeeId,
          avatar: user.avatar?.url || '',
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.employeeId = (user as any).employeeId;
        token.avatar = (user as any).avatar;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).employeeId = token.employeeId as string;
        (session.user as any).avatar = token.avatar as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};
