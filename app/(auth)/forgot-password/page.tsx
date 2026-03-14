'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isValidEmail } from '@/lib/frontendValidation';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resetUrl, setResetUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setResetUrl('');

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to process request');
        return;
      }

      setMessage(data.message || 'Reset request submitted successfully');
      if (data.resetUrl) setResetUrl(data.resetUrl);
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
          <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900">Forgot Password</CardTitle>
          <CardDescription>Enter your account email to reset your password</CardDescription>
        </CardHeader>

        <CardContent className="px-4 sm:px-6 space-y-4">
          {error && <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">{error}</div>}
          {message && <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">{message}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <Button type="submit" className="w-full min-h-[44px] bg-slate-900 hover:bg-slate-700 text-white" disabled={loading}>
              {loading ? 'Processing...' : 'Send Reset Link'}
            </Button>
          </form>

          {resetUrl && (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-2">
              <p className="text-xs sm:text-sm text-slate-700">Reset link generated:</p>
              <Link href={resetUrl} className="text-xs sm:text-sm text-blue-700 underline break-all">
                {resetUrl}
              </Link>
            </div>
          )}

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
