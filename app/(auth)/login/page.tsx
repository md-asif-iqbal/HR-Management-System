'use client';

import { Suspense, useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isNonEmptyText, isValidEmail } from '@/lib/frontendValidation';

async function getFirebaseClient() {
  const [{ initializeApp, getApps }, { getAuth, GoogleAuthProvider, getRedirectResult, signInWithRedirect }] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
  ]);

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  const auth = getAuth(app);
  const googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });

  return { auth, googleProvider, getRedirectResult, signInWithRedirect };
}

function LoginPageContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl') || '/employee/dashboard';

  useEffect(() => {
    let cancelled = false;

    const handleGoogleRedirectResult = async () => {
      try {
        const { auth, getRedirectResult } = await getFirebaseClient();
        const redirectResult = await getRedirectResult(auth);
        if (!redirectResult?.user || cancelled) return;

        setGoogleLoading(true);
        const idToken = await redirectResult.user.getIdToken();

        const nextAuthResult = await signIn('google-firebase', {
          idToken,
          redirect: false,
          callbackUrl,
        });

        if (cancelled) return;

        if (nextAuthResult?.error) {
          setError(nextAuthResult.error);
          setGoogleLoading(false);
          return;
        }

        window.location.href = nextAuthResult?.url || callbackUrl;
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'Google sign-in failed');
          setGoogleLoading(false);
        }
      }
    };

    handleGoogleRedirectResult();

    return () => {
      cancelled = true;
    };
  }, [callbackUrl]);

  // ── Email / Password ────────────────────────────────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!isNonEmptyText(password, 6)) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Authenticate with NextAuth credentials (MongoDB + bcrypt)
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (!result?.error) {
        window.location.href = result?.url || callbackUrl;
        return;
      }

      setError(result.error || 'Sign in failed');
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // ── Google Sign-In ──────────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const { auth, googleProvider, signInWithRedirect } = await getFirebaseClient();
      await signInWithRedirect(auth, googleProvider);
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
      setGoogleLoading(false);
    } finally {
      // redirect flow takes over navigation; keep loader visible unless there is an error
    }
  };

  const isLoading = loading || googleLoading;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-3 py-6 sm:p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center px-4 sm:px-6">
          <div className="mx-auto mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-slate-900">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900">HR Management System</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>

        <CardContent className="px-4 sm:px-6 space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Google Sign-In */}
          <Button
            type="button"
            variant="outline"
            className="w-full min-h-[44px] flex items-center gap-3 border-slate-300"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            {googleLoading ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            {googleLoading ? 'Signing in...' : 'Continue with Google'}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">or sign in with email</span>
            </div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              className="w-full min-h-[44px] bg-slate-900 hover:bg-slate-700 text-white"
              disabled={isLoading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>

            <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600">
              <Link href="/register" className="hover:text-slate-900 underline underline-offset-2">
                Create new account
              </Link>
              <Link href="/forgot-password" className="hover:text-slate-900 underline underline-offset-2">
                Forgot password?
              </Link>
            </div>
          </form>

          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500 text-center">
              Demo: hr@company.com / hr12345 &nbsp;·&nbsp; fatima.begum@company.com / emp123
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-3 py-6 sm:p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center px-4 sm:px-6">
              <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900">HR Management System</CardTitle>
              <CardDescription>Loading sign in...</CardDescription>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}