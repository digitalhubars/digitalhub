import { useState } from 'react';
import Button from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import Field from '../../../components/ui/Field';
import { useApp } from '../../../context/AppContext';
import { ui } from '../../../styles/ui';

const FAQ = [
  ['Why does a store say “Not responding”?', 'The API key was revoked or the store is offline. Edit the integration and paste a fresh key.'],
  ['How fast do edits reach the store?', 'Usually within a few seconds. If a store is paused, changes wait until it resumes.'],
  ['Why does a marketplace say “Reauthorize soon”?', 'Amazon, eBay and TikTok Shop logins expire. Click Reauthorize on the Integrations page and sign in again.'],
  ['Can a client see other clients’ stores?', 'No. Clients only see the stores you give them on the Clients page.'],
];

export default function SupportTab() {
  const { settings, showToast, user, canEditPage } = useApp();
  const [form, setForm] = useState({ subject: '', message: '' });

  const submit = (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) return showToast({ title: 'Add a subject and message', tone: 'danger' });
    showToast({ title: 'Message sent', body: `We'll reply to ${user.email}.` });
    return setForm({ subject: '', message: '' });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Contact support">
        <form onSubmit={submit} className="space-y-4 p-4 sm:p-5">
          <p className={`text-sm ${ui.muted}`}>
            Email us at <span className={ui.h}>{settings.supportEmail}</span> or send a message here.
          </p>
          <Field label="Subject">
            <input className={ui.input} value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
          </Field>
          <Field label="Message">
            <textarea rows={4} className={ui.input} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
          </Field>
          {canEditPage('settings.support') && <Button type="submit" variant="primary">Send message</Button>}
        </form>
      </Card>
      <Card title="Common questions">
        <dl className={ui.divide}>
          {FAQ.map(([q, a]) => (
            <div key={q} className="px-4 py-3.5 sm:px-5">
              <dt className={`text-sm font-medium ${ui.h}`}>{q}</dt>
              <dd className={`mt-1 text-sm ${ui.muted}`}>{a}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
