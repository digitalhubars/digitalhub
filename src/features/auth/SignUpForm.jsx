'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TriangleAlert } from 'lucide-react';
import Button from '../../components/ui/Button';
import Callout from '../../components/ui/Callout';
import Field from '../../components/ui/Field';
import PasswordStrength from '../../components/ui/PasswordStrength';
import { isEmail } from '../../lib/format';
import { authMessage, signUp, watchAuth } from '../../lib/auth';
import { pbConfigured } from '../../lib/pocketbase';
import SetupNotice from './SetupNotice';
import { MIN_STRENGTH, passwordStrength } from '../../lib/password';
import { ui } from '../../styles/ui';
import AuthShell from './AuthShell';

export default function SignUpForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const bind = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  useEffect(() => (pbConfigured ? watchAuth((u) => u && !busy && router.replace('/dashboard')) : undefined), [router, busy]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Enter your name.');
    if (!isEmail(form.email)) return setError('Enter a valid email.');
    if (passwordStrength(form.password) < MIN_STRENGTH) return setError('Pick a stronger password.');
    if (form.password !== form.confirm) return setError('The passwords don’t match.');
    setBusy(true);
    setError('');
    // No role is chosen here: the server makes the very first account the admin,
    // and everyone after that a client with no stores.
    try {
      await signUp({ email: form.email, password: form.password, fullName: form.name });
    } catch (err) {
      console.error('PocketBase sign-up failed:', err);
      setBusy(false);
      return setError(authMessage(err));
    }
    return router.replace('/dashboard');
  };

  if (!pbConfigured) {
    return (
      <AuthShell title="Create an account">
        <SetupNotice />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create an account"
      description="New accounts start with client access. Your admin can assign a client account and stores."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/signin" className="font-medium text-teal-700 hover:underline dark:text-teal-300">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name">
          <input autoComplete="name" className={ui.input} value={form.name} onChange={bind('name')} />
        </Field>
        <Field label="Email">
          <input type="email" autoComplete="email" className={ui.input} value={form.email} onChange={bind('email')} />
        </Field>
        <Field label="Password">
          <input type="password" autoComplete="new-password" className={ui.input} value={form.password} onChange={bind('password')} />
        </Field>
        {form.password && <PasswordStrength value={form.password} />}
        <Field label="Confirm password">
          <input type="password" autoComplete="new-password" className={ui.input} value={form.confirm} onChange={bind('confirm')} />
        </Field>
        {error && (
          <Callout icon={TriangleAlert} tone="danger">
            {error}
          </Callout>
        )}
        <Button type="submit" variant="primary" className="w-full" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthShell>
  );
}
