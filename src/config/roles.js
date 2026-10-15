import { DEFAULT_CLIENT_PERMISSIONS } from '../data/clients';

export const ROLE_LABELS = { admin: 'Admin', manager: 'Manager', client: 'Client' };

export const ALL_ROLES = ['admin', 'manager', 'client'];

// What the signed-in role can do. Clients get the permissions set on their account.
export function getAccess(role, client) {
  if (role === 'admin') {
    return { editProducts: true, addProducts: true, deleteProducts: true, editOrders: true, viewCustomers: true, exportData: true, manageSystem: true };
  }
  if (role === 'manager') {
    return { editProducts: true, addProducts: true, deleteProducts: false, editOrders: true, viewCustomers: true, exportData: true, manageSystem: false };
  }
  const p = client?.permissions || DEFAULT_CLIENT_PERMISSIONS;
  return {
    editProducts: p.editProducts,
    addProducts: p.addProducts,
    deleteProducts: false,
    editOrders: false,
    viewCustomers: p.viewCustomers,
    exportData: p.exportData,
    manageSystem: false,
  };
}
