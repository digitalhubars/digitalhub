import { DAY, NOW } from './constants';

export const DEFAULT_CLIENT_PERMISSIONS = {
  viewCustomers: true,
  editProducts: false,
  addProducts: false,
  exportData: false,
};

export const clients = [
  { id: 'cl_01', company: 'Northwind Outdoor LLC', contact: 'Alex Morgan', email: 'alex@northwind.example', phone: '+1 555 0101', status: 'active', storeIds: ['st_01', 'st_10'], permissions: { viewCustomers: true, editProducts: true, addProducts: false, exportData: true }, createdAt: NOW - 120 * DAY },
  { id: 'cl_02', company: 'Harbor & Pine Group', contact: 'Priya Shah', email: 'priya@harborpine.example', phone: '+1 555 0144', status: 'active', storeIds: ['st_02', 'st_03'], permissions: { viewCustomers: true, editProducts: true, addProducts: true, exportData: true }, createdAt: NOW - 90 * DAY },
  { id: 'cl_03', company: 'Desert Bloom Home', contact: 'Luis Ortega', email: 'luis@desertbloom.example', phone: '+1 555 0172', status: 'active', storeIds: ['st_04'], permissions: { ...DEFAULT_CLIENT_PERMISSIONS }, createdAt: NOW - 60 * DAY },
  { id: 'cl_04', company: 'Copperline Audio', contact: 'Mei Lin', email: 'mei@copperline.example', phone: '+1 555 0190', status: 'invited', storeIds: ['st_05'], permissions: { ...DEFAULT_CLIENT_PERMISSIONS, editProducts: true }, createdAt: NOW - 3 * DAY },
  { id: 'cl_06', company: 'Summit Gear Co.', contact: 'Jonah Reid', email: 'jonah@summitgear.example', phone: '+1 555 0155', status: 'active', storeIds: ['st_07'], permissions: { viewCustomers: true, editProducts: true, addProducts: false, exportData: true }, createdAt: NOW - 45 * DAY },
  { id: 'cl_07', company: 'Vintage Vault', contact: 'Tess Moran', email: 'tess@vintagevault.example', phone: '+1 555 0166', status: 'active', storeIds: ['st_08'], permissions: { ...DEFAULT_CLIENT_PERMISSIONS }, createdAt: NOW - 30 * DAY },
  { id: 'cl_08', company: 'Glow Theory Beauty', contact: 'Aria Chen', email: 'aria@glowtheory.example', phone: '+1 555 0177', status: 'active', storeIds: ['st_09'], permissions: { viewCustomers: true, editProducts: true, addProducts: true, exportData: true }, createdAt: NOW - 20 * DAY },
  { id: 'cl_05', company: 'Little Fern Kids', contact: 'Rosa Bell', email: 'rosa@littlefern.example', phone: '+1 555 0123', status: 'suspended', storeIds: ['st_06'], permissions: { ...DEFAULT_CLIENT_PERMISSIONS }, createdAt: NOW - 200 * DAY },
];
