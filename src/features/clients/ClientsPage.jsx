import { useState } from 'react';
import { Building2, CircleCheck, Eye, Lock, Mail, Pause, Pencil, Play, Store, Trash2, UserPlus } from 'lucide-react';
import ActionMenu from '../../components/ui/ActionMenu';
import { Badge, PlatformDot } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Card, StatCard } from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import Select from '../../components/ui/Select';
import { useApp } from '../../context/AppContext';
import { ui } from '../../styles/ui';
import ClientModal, { CLIENT_PERMISSIONS } from './ClientModal';
import ManageAccessDrawer from './ManageAccessDrawer';

const permissionSummary = (permissions) => {
  const on = Object.keys(CLIENT_PERMISSIONS).filter((k) => permissions[k] && k !== 'viewCustomers');
  return on.length ? on.map((k) => CLIENT_PERMISSIONS[k][0]).join(', ') : 'View only';
};

// Used as the sidebar "Clients" page and, `embedded`, inside Settings → Clients & access.
export default function ClientsPage({ embedded }) {
  const { clients, storeOf, q, deleteClient, setClientStatus, resendInvite, viewAsClient, askConfirm } = useApp();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [accessFor, setAccessFor] = useState(null);

  const ql = (query || q).toLowerCase();
  const rows = clients.filter(
    (c) => (statusFilter === 'all' || c.status === statusFilter) && (!ql || [c.company, c.contact, c.email].some((v) => v.toLowerCase().includes(ql))),
  );
  const count = (status) => clients.filter((c) => c.status === status).length;
  const accessClient = accessFor && clients.find((c) => c.id === accessFor);

  return (
    <div className="space-y-4">
      {!embedded && (
        <PageHeader
          title="Clients"
          description="Create client accounts and choose exactly which stores each one can see."
          actions={
            <Button variant="primary" onClick={() => setEditing({})}>
              <UserPlus size={15} /> New client
            </Button>
          }
        />
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Clients" value={clients.length} icon={Building2} />
        <StatCard label="Active" value={count('active')} icon={CircleCheck} />
        <StatCard label="Invite pending" value={count('invited')} icon={Mail} />
        <StatCard label="Suspended" value={count('suspended')} icon={Lock} />
      </div>

      <Card
        title={`${rows.length} client${rows.length === 1 ? '' : 's'}`}
        action={
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <SearchInput value={query} onChange={setQuery} placeholder="Find a client" className="col-span-2 sm:w-52" />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              className="sm:w-36"
              options={[
                { value: 'all', label: 'Any status' },
                { value: 'active', label: 'Active' },
                { value: 'invited', label: 'Invite pending' },
                { value: 'suspended', label: 'Suspended' },
              ]}
            />
            {embedded && (
              <Button variant="primary" onClick={() => setEditing({})}>
                <UserPlus size={15} /> New
              </Button>
            )}
          </div>
        }
      >
        <DataTable
          rows={rows}
          empty="No clients yet. Create one to give someone access to their stores."
          columns={[
            {
              key: 'company',
              label: 'Name',
              primary: true,
              render: (c) => (
                <div className="min-w-0">
                  <p className={`truncate font-medium ${ui.h}`}>{c.company}</p>
                  <p className={`truncate text-xs font-normal ${ui.muted}`}>{c.contact}</p>
                </div>
              ),
            },
            {
              key: 'email',
              label: 'Email',
              render: (c) => (
                <span className="block max-w-[15rem] truncate" title={c.email}>
                  {c.email}
                </span>
              ),
            },
            {
              key: 'stores',
              label: 'Assigned stores',
              render: (c) => {
                const list = c.storeIds.map(storeOf).filter(Boolean);
                return (
                  <span className="inline-flex items-center gap-2" title={list.map((s) => `${s.name} (${s.platform})`).join('\n')}>
                    <span className={`font-medium tabular-nums ${ui.h}`}>{list.length}</span>
                    <span className="flex gap-1">
                      {[...new Set(list.map((s) => s.platform))].map((p) => (
                        <PlatformDot key={p} platform={p} />
                      ))}
                    </span>
                  </span>
                );
              },
            },
            { key: 'access', label: 'Can', mobileHidden: true, render: (c) => <span className="text-xs">{permissionSummary(c.permissions)}</span> },
            { key: 'status', label: 'Status', aside: true, render: (c) => <Badge status={c.status} /> },
            {
              key: 'actions',
              label: '',
              align: 'right',
              actions: true,
              render: (c) => (
                <div className="flex items-center justify-end gap-1">
                  <Button size="sm" className="whitespace-nowrap" onClick={() => setAccessFor(c.id)}>
                    <Store size={12} /> Manage access
                  </Button>
                  <ActionMenu
                    items={[
                      { label: 'Edit details & permissions', icon: Pencil, onClick: () => setEditing(c) },
                      { label: 'View as this client', icon: Eye, onClick: () => viewAsClient(c.id) },
                      { label: 'Resend invite', icon: Mail, onClick: () => resendInvite(c), hidden: c.status !== 'invited' },
                      {
                        label: 'Suspend access',
                        icon: Pause,
                        hidden: c.status === 'suspended',
                        onClick: () =>
                          askConfirm({
                            title: `Suspend ${c.company}?`,
                            body: 'They will be signed out and can’t sign in until you reactivate them. Their stores keep syncing.',
                            confirmLabel: 'Suspend',
                            onConfirm: () => setClientStatus(c, 'suspended'),
                          }),
                      },
                      { label: 'Reactivate', icon: Play, onClick: () => setClientStatus(c, 'active'), hidden: c.status !== 'suspended' },
                      {
                        label: 'Delete client',
                        icon: Trash2,
                        danger: true,
                        onClick: () =>
                          askConfirm({
                            title: `Delete ${c.company}?`,
                            body: 'This removes their login and store access. Store data stays in Digital Hub.',
                            onConfirm: () => deleteClient(c),
                          }),
                      },
                    ]}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {editing && <ClientModal client={editing} onClose={() => setEditing(null)} />}
      {accessClient && (
        <ManageAccessDrawer
          client={accessClient}
          onClose={() => setAccessFor(null)}
          onEditDetails={() => {
            setAccessFor(null);
            setEditing(accessClient);
          }}
        />
      )}
    </div>
  );
}
