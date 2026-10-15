import { deleteDoc, doc, setDoc, updateDoc } from './firebase/client';
import { fb } from './firebase/client';

export async function adminCreateUser({ email, password, fullName, role, groupId, clientId }) {
  const users = JSON.parse(localStorage.getItem('digital-hub-users') || '{}');
  const id = `u_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  const profile = {
    id,
    email: email.trim(),
    password,
    fullName: fullName.trim(),
    role,
    group_id: role === 'manager' ? groupId || null : null,
    client_id: role === 'client' ? clientId || null : null,
    status: 'active',
    created_at: new Date().toISOString(),
  };
  users[id] = profile;
  localStorage.setItem('digital-hub-users', JSON.stringify(users));
  return { uid: id, profile };
}

export async function adminUpdateUser(account, { role, groupId, clientId, status }, allUsers) {
  const next = {
    role,
    status: status === 'suspended' ? 'suspended' : 'active',
    group_id: role === 'manager' ? groupId || null : null,
    client_id: role === 'client' ? clientId || null : null,
  };
  const losingAdmin = account.role === 'admin' && account.status === 'active' && (next.role !== 'admin' || next.status !== 'active');
  if (losingAdmin && !allUsers.some((u) => u.id !== account.id && u.role === 'admin' && u.status === 'active')) {
    throw new Error('At least one active admin must remain.');
  }
  const profiles = JSON.parse(localStorage.getItem('digital-hub-profiles') || '{}');
  profiles[account.id] = { ...(profiles[account.id] || {}), ...next };
  localStorage.setItem('digital-hub-profiles', JSON.stringify(profiles));
  return { ...account, ...next };
}

export const adminSendPasswordReset = () => Promise.resolve();

export const adminDeleteUser = async (uid) => {
  const users = JSON.parse(localStorage.getItem('digital-hub-users') || '{}');
  delete users[uid];
  localStorage.setItem('digital-hub-users', JSON.stringify(users));
  const profiles = JSON.parse(localStorage.getItem('digital-hub-profiles') || '{}');
  delete profiles[uid];
  localStorage.setItem('digital-hub-profiles', JSON.stringify(profiles));
  await deleteDoc(doc(fb().db, 'users', uid)).catch(() => {});
};
