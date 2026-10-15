import { useState } from 'react';
import { Download, Plus, Trash2 } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import Field from '../../../components/ui/Field';
import Select from '../../../components/ui/Select';
import { useApp } from '../../../context/AppContext';
import { ui } from '../../../styles/ui';
import SaveBar from '../SaveBar';

const FIELDS = ['workspaceName', 'supportEmail', 'currency', 'timezone', 'dateFormat', 'lowStockThreshold'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'PKR'];
const TIMEZONES = ['America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Europe/London', 'Asia/Karachi', 'Asia/Dubai', 'Australia/Sydney'];
const DATE_FORMATS = ['MMM d, yyyy', 'dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd'];

// Backup download and the optional sample stores.
function WorkspaceDataCard() {
  const { exportBackup, hasSampleData, loadSampleData, removeSampleData, askConfirm } = useApp();
  return (
    <Card title="Workspace data">
      <div className="space-y-4 p-4 sm:p-5">
        <p className={`text-sm ${ui.muted}`}>
          Everything is saved in your Firebase database and updates live on every open screen. Download a backup any time.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportBackup}>
            <Download size={15} /> Download backup
          </Button>
          {hasSampleData ? (
            <Button
              className="text-red-700 dark:text-red-400"
              onClick={() =>
                askConfirm({
                  title: 'Remove the sample stores?',
                  body: 'The demo stores and their products, orders, customers and clients are deleted. Your real stores aren’t touched.',
                  confirmLabel: 'Remove samples',
                  onConfirm: removeSampleData,
                })
              }
            >
              <Trash2 size={15} /> Remove sample stores
            </Button>
          ) : (
            <Button onClick={loadSampleData}>
              <Plus size={15} /> Add sample stores
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function GeneralTab() {
  const { settings, updateSettings } = useApp();
  const [form, setForm] = useState(settings);
  const bind = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const dirty = FIELDS.some((k) => String(form[k]) !== String(settings[k]));

  return (
    <div className="space-y-4">
      <Card title="Workspace">
        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
          <Field label="Workspace name" hint="Shown in the sidebar and emails.">
            <input className={ui.input} value={form.workspaceName} onChange={bind('workspaceName')} />
          </Field>
          <Field label="Support email" hint="Clients see this on their dashboard.">
            <input className={ui.input} value={form.supportEmail} onChange={bind('supportEmail')} />
          </Field>
          <Field label="Currency">
            <Select value={form.currency} onChange={set('currency')} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
          </Field>
          <Field label="Time zone">
            <Select value={form.timezone} onChange={set('timezone')} options={TIMEZONES.map((t) => ({ value: t, label: t.replace('_', ' ') }))} />
          </Field>
          <Field label="Date format">
            <Select value={form.dateFormat} onChange={set('dateFormat')} options={DATE_FORMATS.map((d) => ({ value: d, label: d }))} />
          </Field>
          <Field label="Low stock alert below" hint="Used for dashboard alerts and the low stock filter.">
            <input type="number" min="1" className={ui.input} value={form.lowStockThreshold} onChange={bind('lowStockThreshold')} />
          </Field>
        </div>
        <SaveBar
          dirty={dirty}
          onSave={() => updateSettings({ ...form, lowStockThreshold: Math.max(1, Number(form.lowStockThreshold) || 1) }, 'Workspace settings saved')}
        />
      </Card>
      <WorkspaceDataCard />
    </div>
  );
}
