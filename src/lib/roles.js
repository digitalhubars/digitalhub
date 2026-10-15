import { useEffect, useState } from 'react';
import { pb } from './pocketbase';

export const ACCESS_ROLES = ['admin', 'manager', 'staff'];
export const ACCESS_PAGES = [
  'dashboard', 'products', 'orders', 'customers', 'clients', 'integrations', 'settings',
  'settings.general', 'settings.users', 'settings.clients', 'settings.groups', 'settings.sync',
  'settings.api', 'settings.access', 'settings.notifications', 'settings.appearance',
  'settings.security', 'settings.activity', 'settings.support', 'profile', 'password', 'role-access',
];

const ADMIN_PERMISSIONS = Object.fromEntries(
  ACCESS_PAGES.map((page) => [page, { canView: true, canEdit: true, canDelete: true }]),
);

export function getCurrentRole() {
  const role = pb.authStore.record?.role;
  return ACCESS_ROLES.includes(role) ? role : '';
}

export async function loadRolePermissions(role = getCurrentRole()) {
  if (!ACCESS_ROLES.includes(role)) return {};
  if (role === 'admin') return ADMIN_PERMISSIONS;
  const rows = await pb.collection('role_access').getFullList({
    filter: pb.filter('role = {:role}', { role }),
  });
  return Object.fromEntries(rows.map(({ page, canView, canEdit, canDelete }) => [page, { canView, canEdit, canDelete }]));
}

export function canRole(role, permissions, page, action = 'canView') {
  if (!ACCESS_ROLES.includes(role) || !['canView', 'canEdit', 'canDelete'].includes(action)) return false;
  if (role === 'admin') return true;
  return permissions?.[page]?.[action] === true;
}

export function hasAnyRoleAccess(role, permissions) {
  if (role === 'admin') return true;
  return ACCESS_ROLES.includes(role) && Object.values(permissions || {}).some((permission) => permission.canView === true);
}

export function useRoleAccess(role) {
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    let unsubscribe;

    if (!ACCESS_ROLES.includes(role)) {
      setPermissions({});
      setLoading(false);
      setError(null);
      return undefined;
    }

    if (role === 'admin') {
      setPermissions(ADMIN_PERMISSIONS);
      setLoading(false);
      setError(null);
      return undefined;
    }

    setLoading(true);
    setError(null);
    const refresh = async () => {
      try {
        const next = await loadRolePermissions(role);
        if (active) setPermissions(next);
      } catch (reason) {
        console.error(`Failed to load PocketBase role_access permissions for role "${role}":`, reason);
        if (active) {
          setPermissions({});
          setError(reason);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    pb.collection('role_access').subscribe('*', refresh).then((stop) => {
      if (active) unsubscribe = stop;
      else stop();
    }).catch((reason) => {
      console.error(`Failed to subscribe to PocketBase role_access for role "${role}":`, reason);
      if (active) setError(reason);
    });
    refresh();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [role]);

  return { permissions, loading, error };
}
