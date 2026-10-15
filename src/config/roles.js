export const ROLE_LABELS = { admin: 'Admin', manager: 'Manager', staff: 'Staff' };

export const ALL_ROLES = ['admin', 'manager', 'staff'];

export function getAccess(role, client, permissions = {}) {
  const page = (key) => permissions[key] || {};
  const staffClientPermissions = role === 'staff' ? client?.permissions : null;
  const mayEditRecords = role === 'admin' || role === 'manager';
  const products = page('products');
  const orders = page('orders');
  const customers = page('customers');

  return {
    editProducts: mayEditRecords && products.canEdit === true && staffClientPermissions?.editProducts !== false,
    addProducts: mayEditRecords && products.canEdit === true && staffClientPermissions?.addProducts !== false,
    deleteProducts: role === 'admin' && products.canDelete === true,
    editOrders: mayEditRecords && orders.canEdit === true,
    viewCustomers: customers.canView === true && staffClientPermissions?.viewCustomers !== false,
    exportData: [products, orders, customers].some((item) => item.canEdit === true) && staffClientPermissions?.exportData !== false,
    manageSystem: role === 'admin',
  };
}
