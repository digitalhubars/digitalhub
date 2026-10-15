'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import Callout from '../../components/ui/Callout';
import { Card } from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import { ACCESS_ROLES } from '../../lib/roles';
import { authMessage } from '../../lib/auth';
import { pb } from '../../lib/pocketbase';
import { ROLE_LABELS } from '../../config/roles';
import { ui } from '../../styles/ui';

const ROLE_OPTIONS = [
  { value: '', label: 'No role' },
  ...ACCESS_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] })),
];

export default function RoleAccessPage() {
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState('manager');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const [userRecords, permissionRecords] = await Promise.all([
        pb.collection('users').getFullList({ sort: 'email' }),
        pb.collection('role_access').getFullList({ sort: 'page' }),
      ]);
      setUsers(userRecords);
      setPermissions(permissionRecords);
    } catch (reason) {
      console.error('Failed to load Role Access admin data from PocketBase:', reason);
      setError(authMessage(reason));
    }
  }, []);

  useEffect(() => {
    let active = true;
    let stopUsers;
    let stopPermissions;
    refresh();
    pb.collection('users').subscribe('*', () => active && refresh()).then((stop) => {
      if (active) stopUsers = stop;
      else stop();
    }).catch((reason) => {
      console.error('Failed to subscribe to PocketBase users in Role Access:', reason);
      if (active) setError(authMessage(reason));
    });
    pb.collection('role_access').subscribe('*', () => active && refresh()).then((stop) => {
      if (active) stopPermissions = stop;
      else stop();
    }).catch((reason) => {
      console.error('Failed to subscribe to PocketBase role_access:', reason);
      if (active) setError(authMessage(reason));
    });
    return () => {
      active = false;
      stopUsers?.();
      stopPermissions?.();
    };
  }, [refresh]);

  const changeRole = async (user, role) => {
    setBusy(user.id);
    setError('');
    try {
      await pb.collection('users').update(user.id, {
        role,
        group_id: role === 'manager' ? user.group_id || '' : '',
        client_id: role === 'staff' ? user.client_id || '' : '',
        status: user.status || 'active',
      });
      await refresh();
    } catch (reason) {
      setError(authMessage(reason));
    } finally {
      setBusy('');
    }
  };

  const togglePermission = async (row, field) => {
    const key = `${row.id}:${field}`;
    const nextValue = !row[field];
    setBusy(key);
    setError('');
    setPermissions((current) => current.map((item) => item.id === row.id ? { ...item, [field]: nextValue } : item));
    try {
      await pb.collection('role_access').update(row.id, {
        role: row.role,
        page: row.page,
        canView: field === 'canView' ? nextValue : row.canView,
        canEdit: field === 'canEdit' ? nextValue : row.canEdit,
        canDelete: field === 'canDelete' ? nextValue : row.canDelete,
      });
    } catch (reason) {
      setError(authMessage(reason));
      await refresh();
    } finally {
      setBusy('');
    }
  };

  const rows = permissions.filter((item) => item.role === selectedRole).sort((a, b) => a.page.localeCompare(b.page));

  return (
    <div className="space-y-4">
      <Card title="User roles">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={`border-b text-xs uppercase ${ui.line} ${ui.muted}`}>
              <tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Role</th></tr>
            </thead>
            <tbody className={ui.divide}>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3">
                    <span className={`block font-medium ${ui.h}`}>{user.full_name || user.email}</span>
                    <span className={`text-xs ${ui.muted}`}>{user.email}</span>
                  </td>
                  <td className="px-4 py-3"><Badge status={user.status === 'suspended' ? 'suspended' : 'active'} /></td>
                  <td className="w-52 px-4 py-3">
                    <Select value={user.role || ''} onChange={(role) => changeRole(user, role)} disabled={busy === user.id} options={ROLE_OPTIONS} />
                  </td>
                </tr>
              ))}
              {!users.length && <tr><td colSpan="3" className={`px-4 py-6 text-center ${ui.muted}`}>No users found.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Page permissions" action={<Select value={selectedRole} onChange={setSelectedRole} options={ACCESS_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }))} />}>
        {error && <div className="p-4"><Callout tone="danger">{error}</Callout></div>}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={`border-b text-xs uppercase ${ui.line} ${ui.muted}`}>
              <tr>
                <th className="px-4 py-3">Page</th>
                <th className="px-4 py-3 text-center">View</th>
                <th className="px-4 py-3 text-center">Edit</th>
                <th className="px-4 py-3 text-center">Delete</th>
              </tr>
            </thead>
            <tbody className={ui.divide}>
              {rows.map((row) => (
                <tr key={row.id}>
                  <th scope="row" className={`px-4 py-3 font-medium ${ui.h}`}>{row.page}</th>
                  {['canView', 'canEdit', 'canDelete'].map((field) => (
                    <td key={field} className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        aria-label={`${ROLE_LABELS[row.role]} ${field.replace('can', '').toLowerCase()} ${row.page}`}
                        checked={row[field] === true}
                        disabled={Boolean(busy) || row.role === 'admin' || (row.role !== 'admin' && field === 'canDelete') || (row.role === 'staff' && field === 'canEdit')}
                        onChange={() => togglePermission(row, field)}
                        className="h-4 w-4 accent-teal-700"
                      />
                    </td>
                  ))}
                </tr>
              ))}
              {!rows.length && <tr><td colSpan="4" className={`px-4 py-6 text-center ${ui.muted}`}>No permissions seeded for this role. Run the PocketBase setup script.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
