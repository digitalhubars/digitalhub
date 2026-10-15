'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { TriangleAlert } from 'lucide-react';
import Button from '../../components/ui/Button';
import Callout from '../../components/ui/Callout';
import Field from '../../components/ui/Field';
import { isEmail } from '../../lib/format';
import { authMessage, signIn, watchAuth } from '../../lib/auth';
import { pbConfigured } from '../../lib/pocketbase';
import SetupNotice from './SetupNotice';
import { ui } from '../../styles/ui';
import AuthShell from './AuthShell';

// Only follow same-site paths after sign-in.
export const safeNext = (value) => (value && value.startsWith('/') && !value.startsWith('//') ? value : '/dashboard');

const MESSAGES = { 'signed-out': 'You’re signed out.' };

export default function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const notice = MESSAGES[params.get('message')];

  // Already signed in → straight to the dashboard.
  useEffect(() => (pbConfigured ? watchAuth((u) => u && router.replace('/dashboard')) : undefined), [router]);

  const submit = async (e) => {
    e.preventDefault();
    if (!isEmail(form.email)) return setError('Enter a valid email.');
    if (!form.password) return setError('Enter your password.');
    setBusy(true);
    setError('');
    try {
      await signIn(form.email, form.password);
    } catch (err) {
      setBusy(false);
      return setError(authMessage(err));
    }
    // /dashboard forwards each role to its own dashboard.
    return router.replace(safeNext(params.get('next')));
  };

  if (!pbConfigured) {
    return (
      <AuthShell title="Sign in">
        <SetupNotice />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Sign in"
      description="Welcome back. Sign in to manage your stores."
      footer={
        <>
          New here?{' '}
          <Link href="/signup" className="font-medium text-teal-700 hover:underline dark:text-teal-300">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {notice && <Callout tone="info">{notice}</Callout>}
        <Field label="Email">
          <input
            type="email"
            autoComplete="email"
            className={ui.input}
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            autoComplete="current-password"
            className={ui.input}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
        </Field>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-medium text-teal-700 hover:underline dark:text-teal-300">
            Forgot password?
          </Link>
        </div>
        {error && (
          <Callout icon={TriangleAlert} tone="danger">
            {error}
          </Callout>
        )}
        <Button type="submit" variant="primary" className="w-full" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthShell>
  );
}
