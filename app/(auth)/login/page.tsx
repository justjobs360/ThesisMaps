'use client';

import type { Metadata } from 'next';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signIn(email, password);
      router.push(callbackUrl);
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      router.push(callbackUrl);
    } catch {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl font-black text-black tracking-tighter uppercase">
            ThesisMaps<span className="text-accent">.</span>
          </h1>
          <p className="mt-3 text-xs font-sans font-bold uppercase tracking-widest text-black/60">Authentication Engine</p>
        </div>

        <div className="bg-white border-2 border-black p-8 shadow-impact">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <Input
              label="EMAIL ADDRESS"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="rounded-none border-2 border-black focus:border-accent"
            />
            <Input
              label="PASSWORD"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="rounded-none border-2 border-black focus:border-accent"
            />
            {error ? (
              <p role="alert" className="text-[10px] text-red-600 font-sans font-bold uppercase tracking-wider">{error}</p>
            ) : null}
            <Button type="submit" variant="primary" className="w-full h-12 uppercase tracking-widest font-black" loading={loading}>
              Execute Login
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t-2 border-black" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-[10px] font-sans font-black uppercase tracking-widest text-black">OR</span>
            </div>
          </div>

          <Button
            variant="secondary"
            className="w-full h-12 uppercase tracking-widest font-black border-2 border-black hover:bg-black hover:text-white"
            loading={googleLoading}
            onClick={handleGoogle}
            type="button"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden focusable="false" className="mr-2">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google OAuth
          </Button>
        </div>

        <p className="text-center text-xs font-sans font-bold uppercase tracking-widest text-black/60 mt-8">
          New researcher?{' '}
          <Link href="/signup" className="text-accent hover:underline underline-offset-4">Register Account</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-accent animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
