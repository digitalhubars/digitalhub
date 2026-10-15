import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import Callout from '../../components/ui/Callout';
import { Card } from '../../components/ui/Card';
import Field from '../../components/ui/Field';
import PageHeader from '../../components/ui/PageHeader';
import PasswordStrength from '../../components/ui/PasswordStrength';
import { useApp } from '../../context/AppContext';
import { MIN_STRENGTH, passwordStrength } from '../../lib/password';
import { authMessage, changePassword, sendReset } from '../../lib/auth';
import { ui } from '../../styles/ui';

export default function PasswordPage() {
  const { profile, isPreview, showToast, log, go } = useApp();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const bind = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const type = show ? 'text' : 'password';
  const email = profile.email;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.current) return setError('Enter your current password.');
    if (passwordStrength(form.next) < MIN_STRENGTH) return setError('Pick a stronger password.');
    if (form.next !== form.confirm) return setError('The new passwords don’t match.');
    if (form.next === form.current) return setError('Use a password you haven’t used here before.');
    setError('');
    setBusy(true);
    try {
      // PocketBase re-checks the current password before changing it.
      await changePassword(form.current, form.next);
    } catch (err) {
      setBusy(false);
      return setError(err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' ? 'Your current password is wrong.' : authMessage(err));
    }
    setBusy(false);
    log('Changed their password', 'settings');
    showToast({ title: 'Password updated' });
    return setForm({ current: '', next: '', confirm: '' });
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <button
        type="button"
        onClick={() => go('settings', 'security')}
        className={`inline-flex items-center gap-1.5 text-sm ${ui.muted} hover:text-gray-900 dark:hover:text-gray-100`}
      >
        <ArrowLeft size={15} /> Security settings
      </button>
      <PageHeader title="Reset password" description={`Signed in as ${email}`} />
      {isPreview && <Callout tone="info">This changes your own admin password, not the previewed user’s.</Callout>}
      <Card>
        <form onSubmit={submit} className="space-y-4 p-4 sm:p-5">
          <Field label="Current password">
            <input type={type} autoComplete="current-password" className={ui.input} value={form.current} onChange={bind('current')} />
          </Field>
          <Field label="New password">
            <input type={type} autoComplete="new-password" className={ui.input} value={form.next} onChange={bind('next')} />
          </Field>
          <PasswordStrength value={form.next} />
          <Field label="Confirm new password">
            <input type={type} autoComplete="new-password" className={ui.input} value={form.confirm} onChange={bind('confirm')} />
          </Field>
          <label className={`inline-flex items-center gap-2 text-sm ${ui.body}`}>
            <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="h-4 w-4 accent-teal-700" /> Show passwords
          </label>
          {error && <p className="text-sm text-red-700 dark:text-red-400">{error}</p>}
          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              className="text-sm font-medium text-teal-700 hover:underline dark:text-teal-300"
              onClick={() => sendReset(email).then(() => showToast({ title: 'Reset link sent', body: `Check ${email}` }), (err) => showToast({ tone: 'danger', title: authMessage(err) }))}
            >
              Forgot it? Email me a reset link
            </button>
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? 'Updating…' : 'Update password'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
