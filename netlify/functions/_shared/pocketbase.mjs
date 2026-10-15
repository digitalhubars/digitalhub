import PocketBase from 'pocketbase';

export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new HttpError(500, `Missing Netlify environment variable ${name}.`);
  return value;
}

export function newPocketBase() {
  return new PocketBase(required('PB_URL'));
}

export async function getServicePocketBase() {
  const pb = newPocketBase();
  const auth = await pb.collection('users').authWithPassword(
    required('PB_SERVICE_EMAIL'),
    required('PB_SERVICE_PASSWORD'),
  );
  if (auth.record?.role !== 'admin' || auth.record?.status !== 'active') {
    throw new HttpError(500, 'The PocketBase service user must have the active admin role.');
  }
  return pb;
}

export async function authenticateAppRequest(event) {
  const authorization = event.headers?.authorization || event.headers?.Authorization || '';
  const token = authorization.replace(/^Bearer\s+/i, '').trim();
  if (!token) throw new HttpError(401, 'Sign in to run this action.');

  const pb = newPocketBase();
  pb.authStore.save(token, {});
  try {
    const auth = await pb.collection('users').authRefresh();
    if (auth.record?.status !== 'active' || !['admin', 'manager'].includes(auth.record?.role)) {
      throw new HttpError(403, 'Only active admins and managers can run store sync actions.');
    }
    return auth.record;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(401, 'Your PocketBase session is invalid or expired. Sign in again.');
  }
}

export async function getRecordByKey(pb, collectionName, recordKey) {
  try {
    return await pb.collection(collectionName).getFirstListItem(
      pb.filter('recordKey = {:recordKey}', { recordKey }),
    );
  } catch (error) {
    if (error?.status === 404) throw new HttpError(404, `${collectionName} record ${recordKey} was not found.`);
    throw error;
  }
}

export async function upsertByKey(pb, collectionName, recordKey, data) {
  const collection = pb.collection(collectionName);
  let existing = null;
  try {
    existing = await collection.getFirstListItem(pb.filter('recordKey = {:recordKey}', { recordKey }));
  } catch (error) {
    if (error?.status !== 404) throw error;
  }
  const body = { ...data, recordKey };
  return existing ? collection.update(existing.id, body) : collection.create(body);
}

export async function deleteRecord(pb, collectionName, recordKey) {
  let record;
  try {
    record = await pb.collection(collectionName).getFirstListItem(
      pb.filter('recordKey = {:recordKey}', { recordKey }),
    );
  } catch (error) {
    if (error?.status === 404) return false;
    throw error;
  }
  await pb.collection(collectionName).delete(record.id);
  return true;
}

export function recordKeyForStore(storeId, resource, externalId) {
  return `wc_${storeId}_${resource}_${externalId}`;
}

export function storeEnvSuffix(storeId) {
  return String(storeId).toUpperCase().replace(/[^A-Z0-9]/g, '_');
}

export function getWooCredentials(store) {
  const suffix = storeEnvSuffix(store.recordKey);
  const consumerKey = required(`WC_STORE_${suffix}_CONSUMER_KEY`);
  const consumerSecret = required(`WC_STORE_${suffix}_CONSUMER_SECRET`);
  const url = String(store.url || '').trim().replace(/\/+$/, '');
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new HttpError(400, 'Store URL is missing or invalid.');
  }
  if (parsed.protocol !== 'https:' || ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname)) {
    throw new HttpError(400, 'WooCommerce store URL must be a public HTTPS URL.');
  }
  return { url, consumerKey, consumerSecret, envSuffix: suffix };
}

export function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
    body: JSON.stringify(body),
  };
}
