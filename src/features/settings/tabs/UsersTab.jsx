import { useState } from 'react';
import { KeyRound, Pencil, Trash2, UserPlus } from 'lucide-react';
import ActionMenu from '../../../components/ui/ActionMenu';
import { Badge } from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Callout from '../../../components/ui/Callout';
import { Card } from '../../../components/ui/Card';
import DataTable from '../../../components/ui/DataTable';
import Field from '../../../components/ui/Field';
import Modal from '../../../components/ui/Modal';
import PasswordStrength from '../../../components/ui/PasswordStrength';
import Select from '../../../components/ui/Select';
import { ROLE_LABELS } from '../../../config/roles';
import { useApp } from '../../../context/AppContext';
import { formatDate, initials, isEmail } from '../../../lib/format';
import { authMessage } from '../../../lib/auth';
import { adminCreateUser, adminDeleteUser, adminSendPasswordReset, adminUpdateUser } from '../../../lib/users';
import { MIN_STRENGTH, passwordStrength } from '../../../lib/password';
import { ui } from '../../../styles/ui';

const ROLE_HINTS = {
  admin: 'Every store, every setting, and can switch to any dashboard.',
  manager: 'Only the stores in one store group.',
  staff: 'Assigned pages and the stores of one client account.',
};

// Role + what it links to. Shared by the add and edit forms.
function AccessFields({ form, setForm }) {
  const { groups, clients } = useApp();
  return (
    <>
      <Field label="Role" hint={ROLE_HINTS[form.role]}>
        <Select
          value={form.role}
          onChange={(v) => setForm((f) => ({ ...f, role: v }))}
          options={['admin', 'manager', 'staff'].map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
        />
      </Field>
      {form.role === 'manager' && (
        <Field label="Store group" hint="Manage which stores are in each group under Store groups.">
          <Select value={form.group_id} onChange={(v) => setForm((f) => ({ ...f, group_id: v }))} options={groups.map((g) => ({ value: g.id, label: g.name }))} />
        </Field>
      )}
      {form.role === 'staff' && (
        <Field label="Client account" hint="They see only this client’s stores, with its permissions.">
          <Select value={form.client_id} onChange={(v) => setForm((f) => ({ ...f, client_id: v }))} options={clients.map((c) => ({ value: c.id, label: c.company }))} />
        </Field>
      )}
    </>
  );
}

const accessPatch = (form) => ({
  role: form.role,
  group_id: form.role === 'manager' ? form.group_id : null,
  client_id: form.role === 'staff' ? form.client_id : null,
});

function EditUserModal({ account, onClose, onSaved }) {
  const { groups, clients, users, profile: me } = useApp();
  const [form, setForm] = useState({
    role: account.role,
    group_id: account.group_id || groups[0]?.id || '',
    client_id: account.client_id || clients[0]?.id || '',
    status: account.status,
  });
  const [error, setError] = useState('');

  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      const patch = accessPatch(form);
      const updated = await adminUpdateUser(account, { role: patch.role, groupId: patch.group_id, clientId: patch.client_id, status: form.status }, users);
      onSaved(updated);
      return onClose();
    } catch (err) {
      setBusy(false);
      return setError(authMessage(err));
    }
  };

  return (
    <Modal
      title={`Edit ${account.full_name || account.email}`}
      subtitle={<p className={`text-sm ${ui.muted}`}>{account.email}</p>}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <AccessFields form={form} setForm={setForm} />
        <Field label="Status">
          <Select
            value={form.status}
            onChange={(v) => setForm((f) => ({ ...f, status: v }))}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'suspended', label: 'Suspended (can’t open any dashboard)' },
            ]}
          />
        </Field>
        {account.id === me.id && form.role !== 'admin' && (
          <Callout tone="warning">You’re removing your own admin access. Another admin will have to give it back.</Callout>
        )}
        {error && <Callout tone="danger">{error}</Callout>}
      </div>
    </Modal>
  );
}

function AddUserModal({ onClose, onSaved }) {
  const { groups, clients } = useApp();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff', group_id: groups[0]?.id || '', client_id: clients[0]?.id || '' });
  const [error, setError] = useState('');
  const bind = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Enter a name.');
    if (!isEmail(form.email)) return setError('Enter a valid email.');
    if (passwordStrength(form.password) < MIN_STRENGTH) return setError('Pick a stronger password.');
    const patch = accessPatch(form);
    try {
      const result = await adminCreateUser({
        email: form.email.trim(),
        password: form.password,
        fullName: form.name.trim(),
        role: patch.role,
        groupId: patch.group_id,
        clientId: patch.client_id,
      });
      onSaved(result.profile, true);
    } catch (err) {
      return setError(authMessage(err));
    }
    return onClose();
  };

  return (
    <Modal
      title="Add user"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" form="add-user-form" variant="primary">
            Create user
          </Button>
        </>
      }
    >
      <form id="add-user-form" onSubmit={save} className="space-y-4">
        <Field label="Full name">
          <input className={ui.input} value={form.name} onChange={bind('name')} />
        </Field>
        <Field label="Email (used to sign in)">
          <input type="email" className={ui.input} value={form.email} onChange={bind('email')} />
        </Field>
        <Field label="Temporary password" hint="Share it with them; they can change it from their account menu.">
          <input type="text" autoComplete="off" className={`${ui.input} font-mono`} value={form.password} onChange={bind('password')} />
        </Field>
        {form.password && <PasswordStrength value={form.password} />}
        <AccessFields form={form} setForm={setForm} />
        {error && <Callout tone="danger">{error}</Callout>}
      </form>
    </Modal>
  );
}

// PocketBase user accounts. Admin-only tab; only admins can adjust access.
export default function UsersTab() {
  const { groups, clients, users: accounts, profile: me, log, showToast, askConfirm } = useApp();
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);

  const linkLabel = (a) => {
    if (a.role === 'admin') return 'All stores';
    if (a.role === 'manager') return groups.find((g) => g.id === a.group_id)?.name || <span className="text-amber-700 dark:text-amber-400">No group yet</span>;
    return clients.find((c) => c.id === a.client_id)?.company || <span className="text-amber-700 dark:text-amber-400">Not linked yet</span>;
  };

  const onSaved = (user, created) => {
    const label = ROLE_LABELS[user.role].toLowerCase();
    log(`${created ? 'Added' : 'Updated'} ${user.email} as ${label}${user.status === 'suspended' ? ' (suspended)' : ''}`, 'team');
    showToast({ title: created ? 'User added' : 'Access updated', body: `${user.email} is ${label}.` });
  };

  const remove = (a) =>
    askConfirm({
      title: `Delete ${a.full_name || a.email}?`,
      body: 'They lose access to every dashboard. If they sign in again they start over with no stores. Store data isn’t affected.',
      onConfirm: async () => {
        try {
          await adminDeleteUser(a.id);
        } catch (err) {
          return showToast({ tone: 'danger', title: 'Couldn’t delete', body: authMessage(err) });
        }
        log(`Deleted user ${a.email}`, 'team');
        return showToast({ title: 'User deleted', body: a.email });
      },
    });

  return (
    <Card
      title={`Users & roles (${accounts.length})`}
      action={
        <Button variant="primary" size="sm" onClick={() => setAdding(true)}>
          <UserPlus size={13} /> Add user
        </Button>
      }
    >
      <p className={`px-4 pt-4 text-sm sm:px-5 ${ui.muted}`}>
        People who sign up themselves have no role until an admin assigns one. Give managers a store group and staff a client account so they can see
        their dashboard. Sign-in is handled by PocketBase; suspended accounts can’t sign in.
      </p>
      <DataTable
        rows={accounts}
        empty="No users yet."
        columns={[
          {
            key: 'name',
            label: 'User',
            primary: true,
            render: (a) => (
              <div className="flex min-w-0 items-center gap-3">
                <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200 sm:flex">
                  {initials(a.full_name || a.email)}
                </span>
                <div className="min-w-0">
                  <p className={`truncate font-medium ${ui.h}`}>
                    {a.full_name || '—'}
                    {a.id === me.id && <span className={`ml-1 text-xs font-normal ${ui.muted}`}>(you)</span>}
                  </p>
                  <p className={`truncate text-xs font-normal ${ui.muted}`}>{a.email}</p>
                </div>
              </div>
            ),
          },
          { key: 'role', label: 'Role', render: (a) => ROLE_LABELS[a.role] },
          { key: 'link', label: 'Sees', render: linkLabel },
          { key: 'joined', label: 'Joined', render: (a) => formatDate(new Date(a.created_at).getTime()) },
          { key: 'status', label: 'Status', aside: true, render: (a) => <Badge status={a.status === 'suspended' ? 'suspended' : 'active'} /> },
          {
            key: 'actions',
            label: '',
            align: 'right',
            actions: true,
            render: (a) => (
              <div className="flex items-center justify-end gap-1">
                <Button size="sm" onClick={() => setEditing(a)}>
                  <Pencil size={12} /> Edit access
                </Button>
                <ActionMenu
                  items={[
                    {
                      label: 'Send password reset email',
                      icon: KeyRound,
                      onClick: () =>
                        adminSendPasswordReset(a.email).then(
                          () => {
                            log(`Sent a password reset email to ${a.email}`, 'team');
                            showToast({ title: 'Reset email sent', body: a.email });
                          },
                          (err) => showToast({ tone: 'danger', title: 'Couldn’t send', body: authMessage(err) }),
                        ),
                    },
                    { label: 'Delete user', icon: Trash2, danger: true, hidden: a.id === me.id, onClick: () => remove(a) },
                  ]}
                />
              </div>
            ),
          },
        ]}
      />
      {adding && <AddUserModal onClose={() => setAdding(false)} onSaved={onSaved} />}
      {editing && <EditUserModal account={editing} onClose={() => setEditing(null)} onSaved={onSaved} />}
    </Card>
  );
}
