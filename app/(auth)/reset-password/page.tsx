'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isNonEmptyText } from '@/lib/frontendValidation';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Reset token is missing from the URL');
      return;
    }

    if (!isNonEmptyText(password, 6)) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to reset password');
        return;
      }

      setSuccess(data.message || 'Password reset successful');
      setPassword('');
      setConfirmPassword('');
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-3 py-6 sm:p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center px-4 sm:px-6">
          <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900">Reset Password</CardTitle>
          <CardDescription>Set a new password for your account</CardDescription>
        </CardHeader>

        <CardContent className="px-4 sm:px-6 space-y-4">
          {error && <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">{error}</div>}
          {success && <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <Button type="submit" className="w-full min-h-[44px] bg-slate-900 hover:bg-slate-700 text-white" disabled={loading}>
              {loading ? 'Updating password...' : 'Reset Password'}
            </Button>
          </form>

          <p className="text-xs sm:text-sm text-slate-600 text-center">
            Back to{' '}
            <Link href="/login" className="underline underline-offset-2 hover:text-slate-900">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-3 py-6 sm:p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center px-4 sm:px-6">
              <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900">Reset Password</CardTitle>
              <CardDescription>Loading reset form...</CardDescription>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
