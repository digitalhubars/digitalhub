import PocketBase from 'pocketbase';

const pbUrl = process.env.NEXT_PUBLIC_PB_URL?.trim();

if (!pbUrl) {
  console.error('PocketBase is not configured. Set NEXT_PUBLIC_PB_URL in the deployment environment and rebuild the app.');
}

export const pb = new PocketBase(pbUrl || '');
export const pbConfigured = Boolean(pbUrl);

export function getCurrentUser() {
  const model = pb.authStore.model;
  if (!model) return null;
  return { ...model, uid: model.id, displayName: model.full_name || model.name || model.email || '' };
}

export function watchAuth(callback) {
  callback(getCurrentUser());
  return pb.authStore.onChange((_token, model) => {
    callback(model ? { ...model, uid: model.id, displayName: model.full_name || model.name || model.email || '' } : null);
  });
}

export function normalizeRecord(record) {
  if (!record) return null;
  const normalized = { ...record, id: record.recordKey || record.id };
  Object.defineProperty(normalized, '_pbId', { value: record.id });
  return normalized;
}

export async function findRecord(collectionName, externalId) {
  try {
    return await pb.collection(collectionName).getFirstListItem(
      pb.filter('recordKey = {:recordKey}', { recordKey: externalId }),
    );
  } catch (error) {
    if (error?.status === 404) return null;
    throw error;
  }
}

export async function saveRecord(collectionName, externalId, data) {
  const collection = pb.collection(collectionName);
  const existing = await findRecord(collectionName, externalId);
  const payload = { ...data, recordKey: externalId };
  return existing ? collection.update(existing.id, payload) : collection.create(payload);
}

export async function deleteRecord(collectionName, externalId) {
  const record = await findRecord(collectionName, externalId);
  if (!record) return false;
  await pb.collection(collectionName).delete(record.id);
  return true;
}

export async function call(action, payload = {}) {
  const response = await fetch('/.netlify/functions/digital-hub', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${pb.authStore.token}`,
    },
    body: JSON.stringify({ action, payload }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.message || `Server action failed with status ${response.status}.`);
    error.status = response.status;
    error.response = result;
    throw error;
  }
  return result;
}
