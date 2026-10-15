import { useState } from 'react';
import Button from '../../components/ui/Button';
import Field from '../../components/ui/Field';
import Modal from '../../components/ui/Modal';
import Toggle from '../../components/ui/Toggle';
import { useApp } from '../../context/AppContext';
import { DEFAULT_CLIENT_PERMISSIONS } from '../../data/clients';
import { isEmail } from '../../lib/format';
import { ui } from '../../styles/ui';
import StorePicker from './StorePicker';

// permission key -> [label, hint]
export const CLIENT_PERMISSIONS = {
  viewCustomers: ['View customers', 'See customer names, emails and order history.'],
  editProducts: ['Edit products', 'Change title, price, stock and status. Changes sync to the store.'],
  addProducts: ['Add products', 'Create new products in their stores.'],
  exportData: ['Export data', 'Download products, orders and customers as CSV.'],
};

export default function ClientModal({ client, onClose }) {
  const { stores, clients, saveClient } = useApp();
  const isNew = !client.id;
  const [form, setForm] = useState({
    company: client.company || '',
    contact: client.contact || '',
    email: client.email || '',
    phone: client.phone || '',
    storeIds: client.storeIds || [],
    permissions: { ...DEFAULT_CLIENT_PERMISSIONS, ...(client.permissions || {}) },
    sendInvite: true,
  });
  const [errors, setErrors] = useState({});
  const bind = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // "Add" implies "Edit"; turning off "Edit" turns off "Add".
  const setPermission = (key, on) =>
    setForm((f) => ({
      ...f,
      permissions: {
        ...f.permissions,
        [key]: on,
        ...(key === 'editProducts' && !on ? { addProducts: false } : {}),
        ...(key === 'addProducts' && on ? { editProducts: true } : {}),
      },
    }));

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (!form.company.trim()) next.company = 'Company name is required.';
    if (!form.contact.trim()) next.contact = 'Contact name is required.';
    if (!isEmail(form.email)) next.email = 'Enter a valid email.';
    else if (clients.some((c) => c.email.toLowerCase() === form.email.toLowerCase() && c.id !== client.id)) {
      next.email = 'Another client already uses this email.';
    }
    if (!form.storeIds.length) next.storeIds = 'Give access to at least one store.';
    setErrors(next);
    if (Object.keys(next).length) return;
    saveClient({ ...client, ...form, company: form.company.trim(), contact: form.contact.trim() }, isNew);
    onClose();
  };

  return (
    <Modal
      title={isNew ? 'New client' : `Edit ${client.company}`}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" form="client-form" variant="primary">
            {isNew ? 'Create client' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form id="client-form" onSubmit={submit} className="space-y-6">
        <section>
          <h4 className={`mb-3 text-sm font-semibold ${ui.h}`}>Client details</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company" error={errors.company}>
              <input className={ui.input} value={form.company} onChange={bind('company')} placeholder="e.g. Harbor & Pine Group" />
            </Field>
            <Field label="Contact name" error={errors.contact}>
              <input className={ui.input} value={form.contact} onChange={bind('contact')} />
            </Field>
            <Field label="Email (used to sign in)" error={errors.email}>
              <input type="email" className={ui.input} value={form.email} onChange={bind('email')} />
            </Field>
            <Field label="Phone">
              <input className={ui.input} value={form.phone} onChange={bind('phone')} />
            </Field>
          </div>
        </section>

        <section>
          <h4 className={`mb-2 text-sm font-semibold ${ui.h}`}>Store access</h4>
          <StorePicker stores={stores} picked={form.storeIds} onChange={(ids) => setForm((f) => ({ ...f, storeIds: ids }))} />
          {errors.storeIds && <p className="mt-1.5 text-xs text-red-700 dark:text-red-400">{errors.storeIds}</p>}
        </section>

        <section>
          <h4 className={`text-sm font-semibold ${ui.h}`}>What this client can do</h4>
          <p className={`text-xs ${ui.muted}`}>Clients can always see their dashboard and orders. Everything else is opt-in.</p>
          <div className={ui.divide}>
            {Object.entries(CLIENT_PERMISSIONS).map(([key, [label, hint]]) => (
              <Toggle key={key} label={label} hint={hint} checked={form.permissions[key]} onChange={(on) => setPermission(key, on)} />
            ))}
          </div>
        </section>

        {isNew && (
          <label className={`flex items-center gap-2 text-sm ${ui.body}`}>
            <input
              type="checkbox"
              checked={form.sendInvite}
              onChange={(e) => setForm((f) => ({ ...f, sendInvite: e.target.checked }))}
              className="h-4 w-4 accent-teal-700"
            />
            Email an invite to {form.email || 'the client'} now
          </label>
        )}
      </form>
    </Modal>
  );
}
