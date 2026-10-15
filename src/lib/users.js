import { pb } from './pocketbase';

export async function adminCreateUser({ email, password, fullName, role, groupId, clientId }) {
  const created = await pb.collection('users').create({
    email: email.trim(),
    password,
    passwordConfirm: password,
    full_name: fullName.trim(),
    phone: '',
    status: 'active',
    created_at: new Date().toISOString(),
  });
  const profile = await pb.collection('users').update(created.id, {
    role,
    group_id: role === 'manager' ? groupId || '' : '',
    client_id: role === 'staff' ? clientId || '' : '',
  });
  return { uid: profile.id, profile };
}

export async function adminUpdateUser(account, { role, groupId, clientId, status }, allUsers) {
  const next = {
    role,
    status: status === 'suspended' ? 'suspended' : 'active',
    group_id: role === 'manager' ? groupId || '' : '',
    client_id: role === 'staff' ? clientId || '' : '',
  };
  const losingAdmin = account.role === 'admin' && account.status === 'active' && (next.role !== 'admin' || next.status !== 'active');
  if (losingAdmin && !allUsers.some((user) => user.id !== account.id && user.role === 'admin' && user.status === 'active')) {
    throw new Error('At least one active admin must remain.');
  }
  return pb.collection('users').update(account.id, next);
}

export const adminSendPasswordReset = (email) => pb.collection('users').requestPasswordReset(email.trim());

export const adminDeleteUser = (id) => pb.collection('users').delete(id);
