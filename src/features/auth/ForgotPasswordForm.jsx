'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, TriangleAlert } from 'lucide-react';
import Button from '../../components/ui/Button';
import Callout from '../../components/ui/Callout';
import Field from '../../components/ui/Field';
import { authMessage, sendReset } from '../../lib/auth';
import { isEmail } from '../../lib/format';
import { ui } from '../../styles/ui';
import AuthShell from './AuthShell';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!isEmail(email)) return setError('Enter a valid email.');
    setBusy(true);
    try {
      await sendReset(email);
    } catch (err) {
      // Don't reveal whether an account exists; only show real problems.
      if (err.code !== 'auth/user-not-found') {
        setBusy(false);
        return setError(authMessage(err));
      }
    }
    setBusy(false);
    return setSent(true);
  };

  return (
    <AuthShell
      title="Reset your password"
      description="We'll email you a link to choose a new password."
      footer={
        <Link href="/signin" className="font-medium text-teal-700 hover:underline dark:text-teal-300">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <Callout icon={Mail} tone="info">
          If {email} has an account, a reset link is on its way. Check your spam folder too.
        </Callout>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email">
            <input type="email" autoComplete="email" className={ui.input} value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          {error && (
            <Callout icon={TriangleAlert} tone="danger">
              {error}
            </Callout>
          )}
          <Button type="submit" variant="primary" className="w-full" disabled={busy}>
            {busy ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
