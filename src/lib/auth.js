import { pb, getCurrentUser } from './pocketbase';

export const authMessage = (err) => {
  const response = err?.response;
  const fieldErrors = response?.data && Object.entries(response.data)
    .map(([field, detail]) => `${field}: ${detail?.message || detail}`)
    .join('; ');
  return fieldErrors || response?.message || err?.message || 'Unknown PocketBase error.';
};

export const watchAuth = (callback) => {
  const authModel = getCurrentUser();
  callback(authModel);
  const unsubscribe = pb.authStore.onChange((token, model) => {
    callback(model ? { ...model, id: model.id, uid: model.id, displayName: model.full_name || model.name || model.email || '' } : null);
  });
  return unsubscribe || (() => {});
};

export async function ensureProfile() {
  const user = getCurrentUser();
  if (!user) throw new Error('Sign in first.');
  const profile = await pb.collection('users').getOne(user.id);
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

  await pb.collection('users').create({
    email: emailValue,
    password,
    passwordConfirm: password,
    full_name: fullNameValue,
    phone: '',
    role: 'client',
    group_id: '',
    client_id: '',
    status: 'active',
    created_at: new Date().toISOString(),
  });

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
  await pb.collection('users').update(user.id, {
    password: next,
    passwordConfirm: next,
    role: user.role,
    group_id: user.group_id || '',
    client_id: user.client_id || '',
    status: user.status || 'active',
  });
  return true;
}

export async function updateOwnProfile(uid, { full_name, phone, email }) {
  const user = getCurrentUser();
  const patch = {
    full_name,
    phone,
    role: user?.role || 'client',
    group_id: user?.group_id || '',
    client_id: user?.client_id || '',
    status: user?.status || 'active',
  };
  if (email) patch.email = email.trim();
  const updated = await pb.collection('users').update(uid, patch);
  return { emailPending: false, record: updated };
}
