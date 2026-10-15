import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import Field from '../../components/ui/Field';
import PageHeader from '../../components/ui/PageHeader';
import { ROLE_LABELS } from '../../config/roles';
import { useApp } from '../../context/AppContext';
import { initials, isEmail } from '../../lib/format';
import { ui } from '../../styles/ui';
import SaveBar from '../settings/SaveBar';

const fromUser = (user) => ({ name: user.name, email: user.email, phone: user.phone || '', title: user.title || '' });

export default function ProfilePage() {
  const { user, role, client, updateProfile, settings } = useApp();
  const [form, setForm] = useState(fromUser(user));
  const [errors, setErrors] = useState({});
  // Reload the form when "view as" switches to someone else.
  useEffect(() => setForm(fromUser(user)), [user.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const bind = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const save = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required.';
    if (!isEmail(form.email)) next.email = 'Enter a valid email.';
    setErrors(next);
    if (!Object.keys(next).length) updateProfile({ ...form, name: form.name.trim() });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title="Profile" description="How you appear to your team and in the activity log." />
      <Card>
        <div className={`flex flex-col items-center gap-4 border-b p-5 text-center sm:flex-row sm:text-left ${ui.line}`}>
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-900 text-xl font-semibold text-white dark:bg-gray-100 dark:text-gray-900">
            {initials(user.name)}
          </span>
          <div>
            <p className={`text-lg font-semibold ${ui.h}`}>{user.name}</p>
            <p className={`text-sm ${ui.muted}`}>
              {ROLE_LABELS[role]}
              {role === 'client' ? ` · ${client?.company}` : ` · ${settings.workspaceName}`}
            </p>
          </div>
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
          <Field label="Full name" error={errors.name}>
            <input className={ui.input} value={form.name} onChange={bind('name')} />
          </Field>
          <Field label="Email" error={errors.email} hint="A confirmation link is sent when you change it.">
            <input type="email" className={ui.input} value={form.email} onChange={bind('email')} />
          </Field>
          <Field label="Phone">
            <input className={ui.input} value={form.phone} onChange={bind('phone')} />
          </Field>
          {role === 'client' ? (
            <Field label="Company">
              <input className={ui.input} value={client?.company || ''} disabled />
            </Field>
          ) : (
            <Field label="Job title">
              <input className={ui.input} value={form.title} onChange={bind('title')} />
            </Field>
          )}
        </div>
        <SaveBar onSave={save} />
      </Card>
    </div>
  );
}
