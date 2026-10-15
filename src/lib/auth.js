import PocketBase from 'pocketbase';
import { isOwnerEmail } from '../config/owner';
import { pb, getCurrentUser } from './pocketbase';

const FRIENDLY = {
  'auth/invalid-credential': 'Email or password is wrong.',
  'auth/wrong-password': 'Email or password is wrong.',
  'auth/user-not-found': 'Email or password is wrong.',
  'auth/invalid-email': 'Enter a valid email.',
  'auth/email-already-in-use': 'An account with this email already exists. Sign in instead.',
  'auth/weak-password': 'Pick a stronger password.',
  'auth/user-disabled': 'This account is suspended. Ask your admin.',
  'auth/too-many-requests': 'Too many tries. Wait a minute and try again.',
  'auth/network-request-failed': 'Can’t reach the server. Check your connection.',
  'auth/requires-recent-login': 'Sign out and in again, then retry.',
  'permission-denied': 'You don’t have access to this. Ask your admin.',
  unavailable: 'Can’t reach the database. Check your connection and try again.',
};

export const authMessage = (err) => FRIENDLY[err?.code] || err?.message || 'Something went wrong.';

export const watchAuth = (callback) => {
  const authModel = getCurrentUser();
  callback(authModel);
  const unsubscribe = pb.authStore.onChange((token, model) => {
    callback(model ? { ...model, id: model.id, uid: model.id, displayName: model.full_name || model.name || model.email || '' } : null);
  });
  return unsubscribe || (() => {});
};

async function seedWorkspace() {
  try {
    await pb.collection('workspace').create({ id: 'settings', workspaceName: 'Digital Hub', currency: 'USD', lowStockThreshold: 10 });
  } catch (err) {
    if (err?.status !== 409) throw err;
  }
  try {
    await pb.collection('groups').create({ id: 'g_main', name: 'Main' });
  } catch (err) {
    if (err?.status !== 409) throw err;
  }
}

export async function ensureProfile(fullName = '') {
  const user = getCurrentUser();
  if (!user) throw new Error('Sign in first.');

  const owner = isOwnerEmail(user.email);
  let profile = null;

  try {
    profile = await pb.collection('users').getOne(user.id);
  } catch (err) {
    if (err?.status !== 404) throw err;
  }

  const nextName = String(fullName || user.displayName || user.name || '').trim().slice(0, 120);

  if (!profile) {
    const created = await pb.collection('users').create({
      id: user.id,
      email: user.email,
      full_name: nextName,
      phone: '',
      role: owner ? 'admin' : 'client',
      group_id: null,
      client_id: null,
      status: 'active',
      created_at: new Date().toISOString(),
      password: '',
    });
    if (owner) await seedWorkspace();
    return { created: true, role: created.role || (owner ? 'admin' : 'client') };
  }

  if (user.email && profile.email !== user.email) {
    profile = await pb.collection('users').update(profile.id, { email: user.email });
  }

  if (owner && profile.role === 'client' && !profile.client_id) {
    profile = await pb.collection('users').update(profile.id, { role: 'admin' });
    await seedWorkspace();
    return { created: false, role: 'admin' };
  }

  return { created: false, role: profile.role || 'client' };
}

export const resendVerification = () => Promise.resolve();

export async function signIn(email, password) {
  const authData = await pb.collection('users').authWithPassword(email.trim(), password);
  const user = authData?.record || authData?.user || getCurrentUser();
  await ensureProfile(user.full_name || user.name || '');
  return user;
}

export async function signUp({ email, password, fullName }) {
  const emailValue = email.trim();
  const fullNameValue = String(fullName || '').trim();

  try {
    await pb.collection('users').create({
      email: emailValue,
      password,
      passwordConfirm: password,
      full_name: fullNameValue,
      phone: '',
      role: 'client',
      group_id: null,
      client_id: null,
      status: 'active',
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    if (err?.status === 400 || err?.status === 409 || err?.message?.includes('already')) {
      throw new Error('auth/email-already-in-use');
    }
    throw err;
  }

  const authData = await pb.collection('users').authWithPassword(emailValue, password);
  await ensureProfile(fullNameValue);
  return authData.record || authData.user || getCurrentUser();
}

export const signOut = async () => pb.authStore.clear();

export const sendReset = (email) => pb.collection('users').requestPasswordReset(email.trim());

export async function changePassword(current, next) {
  const user = getCurrentUser();
  if (!user) throw new Error('Sign in first.');
  await pb.collection('users').authWithPassword(user.email, current);
  await pb.collection('users').update(user.id, { password: next, passwordConfirm: next });
  return true;
}

export async function updateOwnProfile(uid, { full_name, phone, email }) {
  const patch = { full_name, phone };
  if (email) patch.email = email.trim();
  const updated = await pb.collection('users').update(uid, patch);
  return { emailPending: false, record: updated };
}
