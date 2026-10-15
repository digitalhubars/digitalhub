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

export function getPocketBaseUrl() {
  return process.env.PB_URL?.trim() || process.env.NEXT_PUBLIC_PB_URL?.trim() || '';
}

export function serviceEnvironmentStatus(storeSuffixes = []) {
  const status = {
    PB_URL: Boolean(process.env.PB_URL?.trim()),
    NEXT_PUBLIC_PB_URL: Boolean(process.env.NEXT_PUBLIC_PB_URL?.trim()),
    PB_SERVICE_EMAIL: Boolean(process.env.PB_SERVICE_EMAIL?.trim()),
    PB_SERVICE_PASSWORD: Boolean(process.env.PB_SERVICE_PASSWORD?.trim()),
  };
  for (const suffix of storeSuffixes) {
    for (const ending of ['CONSUMER_KEY', 'CONSUMER_SECRET', 'WEBHOOK_SECRET']) {
      const name = `WC_STORE_${suffix}_${ending}`;
      status[name] = Boolean(process.env[name]?.trim());
    }
  }
  return status;
}

export function missingServiceEnvironment(store, includeWebhookSecret = false) {
  const status = serviceEnvironmentStatus(store ? [storeEnvSuffix(store.recordKey)] : []);
  const missing = [];
  if (!status.PB_URL && !status.NEXT_PUBLIC_PB_URL) missing.push('PB_URL or NEXT_PUBLIC_PB_URL');
  for (const name of ['PB_SERVICE_EMAIL', 'PB_SERVICE_PASSWORD']) if (!status[name]) missing.push(name);
  if (store) {
    const suffix = storeEnvSuffix(store.recordKey);
    for (const name of [`WC_STORE_${suffix}_CONSUMER_KEY`, `WC_STORE_${suffix}_CONSUMER_SECRET`]) {
      if (!status[name]) missing.push(name);
    }
    const webhookName = `WC_STORE_${suffix}_WEBHOOK_SECRET`;
    if (includeWebhookSecret && !status[webhookName]) missing.push(webhookName);
  }
  return missing;
}

export function newPocketBase() {
  const url = getPocketBaseUrl();
  if (!url) throw new HttpError(500, 'Missing Netlify environment variables: PB_URL or NEXT_PUBLIC_PB_URL.');
  return new PocketBase(url);
}

export async function getServicePocketBase() {
  const missing = missingServiceEnvironment();
  if (missing.length) throw new HttpError(500, `Missing Netlify environment variables: ${missing.join(', ')}.`);
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
  const { record } = await getAuthenticatedAppRequest(event);
  return record;
}

export async function getAuthenticatedAppRequest(event) {
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
    return { pb, record: auth.record };
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
  const missing = missingServiceEnvironment(store).filter((name) => name.startsWith('WC_STORE_'));
  if (missing.length) throw new HttpError(500, `Missing Netlify environment variables: ${missing.join(', ')}.`);
  const consumerKey = process.env[`WC_STORE_${suffix}_CONSUMER_KEY`].trim();
  const consumerSecret = process.env[`WC_STORE_${suffix}_CONSUMER_SECRET`].trim();
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
