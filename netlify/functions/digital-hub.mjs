import {
  deleteRecord,
  getAuthenticatedAppRequest,
  getRecordByKey,
  getServicePocketBase,
  HttpError,
  jsonResponse,
  missingServiceEnvironment,
  serviceEnvironmentStatus,
  storeEnvSuffix,
} from './_shared/pocketbase.mjs';
import { syncWooStore, testWooConnection } from './_shared/woocommerce.mjs';

async function disconnectStore(pb, storeKey) {
  const store = await getRecordByKey(pb, 'stores', storeKey);
  for (const collectionName of ['products', 'orders', 'customers']) {
    const records = await pb.collection(collectionName).getFullList({
      filter: pb.filter('storeId = {:storeId}', { storeId: storeKey }),
    });
    for (const record of records) await pb.collection(collectionName).delete(record.id);
  }

  const clients = await pb.collection('clients').getFullList();
  for (const client of clients) {
    if ((client.storeIds || []).includes(storeKey)) {
      await pb.collection('clients').update(client.id, { storeIds: client.storeIds.filter((id) => id !== storeKey) });
    }
  }
  await deleteRecord(pb, 'storeSecrets', storeKey);
  await pb.collection('stores').delete(store.id);
  return { ok: true, message: `${store.name} was disconnected and its synced records were removed.` };
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') return jsonResponse(405, { ok: false, message: 'Use POST for sync actions.' });

  try {
    const { pb: callerPb, record: caller } = await getAuthenticatedAppRequest(event);
    const body = JSON.parse(event.body || '{}');
    const action = body.action;
    const payload = body.payload || {};

    if (action === 'diagnostics') {
      if (caller.role !== 'admin') throw new HttpError(403, 'Only admins can inspect server environment status.');
      const stores = await callerPb.collection('stores').getFullList({ filter: 'platform = "WooCommerce"' });
      const status = serviceEnvironmentStatus(stores.map((store) => storeEnvSuffix(store.recordKey)));
      return jsonResponse(200, status);
    }

    if (!['syncStore', 'testWooConnection', 'disconnectStore'].includes(action)) {
      throw new HttpError(404, `Unknown sync action: ${String(action || '')}`);
    }
    if (!payload.storeId) throw new HttpError(400, 'A storeId is required.');
    const visibleStore = await getRecordByKey(callerPb, 'stores', payload.storeId);
    if (caller.role === 'manager' && (!caller.group_id || caller.group_id !== visibleStore.groupId)) {
      throw new HttpError(403, 'You do not have access to this store.');
    }
    const missing = missingServiceEnvironment(action === 'disconnectStore' ? null : visibleStore);
    if (missing.length) throw new HttpError(500, `Missing Netlify environment variables: ${missing.join(', ')}.`);

    const pb = await getServicePocketBase();
    const store = await getRecordByKey(pb, 'stores', payload.storeId);
    if (action === 'disconnectStore') return jsonResponse(200, await disconnectStore(pb, payload.storeId));
    if (store.platform !== 'WooCommerce') throw new HttpError(400, 'Only WooCommerce stores are supported by this sync endpoint.');
    if (action === 'syncStore') return jsonResponse(200, { ok: true, ...(await syncWooStore(pb, store)) });
    return jsonResponse(200, await testWooConnection(pb, store));
  } catch (error) {
    const statusCode = error instanceof HttpError ? error.statusCode : 500;
    console.error('Digital Hub Netlify function failed:', error?.message || error);
    return jsonResponse(statusCode, { ok: false, message: error?.message || 'The server action failed.' });
  }
}
