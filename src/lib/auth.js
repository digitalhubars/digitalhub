import { isOwnerEmail } from '../config/owner';
import { clearAuthSession, doc, getAuthSession, getDoc, setAuthSession, setDoc, updateDoc } from './firebase/client';

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

const readUsers = () => {
  try {
    return JSON.parse(localStorage.getItem('digital-hub-users') || '{}');
  } catch {
    return {};
  }
};

const writeUsers = (next) => {
  localStorage.setItem('digital-hub-users', JSON.stringify(next));
};

const readProfiles = () => {
  try {
    return JSON.parse(localStorage.getItem('digital-hub-profiles') || '{}');
  } catch {
    return {};
  }
};

const writeProfiles = (next) => {
  localStorage.setItem('digital-hub-profiles', JSON.stringify(next));
};

export const authMessage = (err) => FRIENDLY[err?.code] || err?.message || 'Something went wrong.';

export const watchAuth = (callback) => {
  if (typeof window === 'undefined') return () => {};
  const emit = () => callback(getAuthSession());
  emit();
  window.addEventListener('digital-hub-auth', emit);
  return () => window.removeEventListener('digital-hub-auth', emit);
};

async function seedWorkspace() {
  await setDoc(doc(null, 'workspace/settings'), { workspaceName: 'Digital Hub', currency: 'USD', lowStockThreshold: 10 }, { merge: true });
  await setDoc(doc(null, 'groups/g_main'), { name: 'Main' }, { merge: true });
}

export async function ensureProfile(fullName = '') {
  const user = getAuthSession();
  if (!user) throw new Error('Sign in first.');

  const owner = isOwnerEmail(user.email);
  const profiles = readProfiles();
  const uid = String(user.uid || user.id || user.email);
  const existing = profiles[uid];

  if (!existing) {
    const profile = {
      id: uid,
      email: user.email,
      full_name: String(fullName || user.displayName || user.name || '').trim().slice(0, 120),
      phone: '',
      role: owner ? 'admin' : 'client',
      group_id: null,
      client_id: null,
      status: 'active',
      created_at: new Date().toISOString(),
    };
    profiles[uid] = profile;
    writeProfiles(profiles);
    if (owner) await seedWorkspace();
    return { created: true, role: profile.role };
  }

  const current = existing;
  if (user.email && current.email !== user.email) {
    current.email = user.email;
    profiles[uid] = current;
    writeProfiles(profiles);
  }
  if (owner && current.role === 'client' && !current.client_id) {
    current.role = 'admin';
    profiles[uid] = current;
    writeProfiles(profiles);
    await seedWorkspace();
    return { created: false, role: 'admin' };
  }
  return { created: false, role: current.role };
}

export const resendVerification = () => Promise.resolve();

export async function signIn(email, password) {
  const users = readUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const entry = Object.values(users).find((u) => u.email && u.email.toLowerCase() === normalizedEmail && u.password === password);
  if (!entry) throw new Error('auth/invalid-credential');
  const user = { uid: entry.id, id: entry.id, email: entry.email, name: entry.fullName || entry.full_name || entry.email, displayName: entry.fullName || entry.full_name || entry.email };
  setAuthSession(user);
  await ensureProfile(user.displayName || '');
  return user;
}

export async function signUp({ email, password, fullName }) {
  const users = readUsers();
  const normalizedEmail = email.trim().toLowerCase();
  if (Object.values(users).some((u) => u.email && u.email.toLowerCase() === normalizedEmail)) {
    throw new Error('auth/email-already-in-use');
  }
  const id = `u_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  const profile = {
    id,
    email: email.trim(),
    password,
    fullName: fullName.trim(),
    role: 'client',
    group_id: null,
    client_id: null,
    status: 'active',
    created_at: new Date().toISOString(),
  };
  users[id] = profile;
  writeUsers(users);
  const authUser = { uid: id, id, email: email.trim(), name: fullName.trim(), displayName: fullName.trim() };
  setAuthSession(authUser);
  await ensureProfile(fullName.trim());
  return { created: true, role: 'client' };
}

export const signOut = () => clearAuthSession();
export const sendReset = () => Promise.resolve();

export async function changePassword(current, next) {
  const session = getAuthSession();
  if (!session) throw new Error('Sign in first.');
  const users = readUsers();
  const target = Object.values(users).find((u) => u.id === session.uid);
  if (!target || current !== target.password) throw new Error('auth/invalid-credential');
  target.password = next;
  writeUsers(users);
  return true;
}

export async function updateOwnProfile(uid, { full_name, phone, email }) {
  const profiles = readProfiles();
  const profile = profiles[uid] || { id: uid };
  profile.full_name = full_name;
  profile.phone = phone;
  profiles[uid] = profile;
  writeProfiles(profiles);
  const current = getAuthSession();
  if (email && current && current.email && email.trim().toLowerCase() !== current.email.toLowerCase()) {
    current.email = email.trim();
    setAuthSession(current);
    const users = readUsers();
    const user = Object.values(users).find((u) => u.id === uid);
    if (user) {
      user.email = email.trim();
      writeUsers(users);
    }
  }
  return { emailPending: false };
}
