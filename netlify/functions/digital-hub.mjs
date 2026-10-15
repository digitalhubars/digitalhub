import {
  deleteRecord,
  authenticateAppRequest,
  getRecordByKey,
  getServicePocketBase,
  HttpError,
  jsonResponse,
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
    const caller = await authenticateAppRequest(event);
    const body = JSON.parse(event.body || '{}');
    const action = body.action;
    const payload = body.payload || {};
    const pb = await getServicePocketBase();

    if (action === 'syncStore' || action === 'testWooConnection' || action === 'disconnectStore') {
      if (!payload.storeId) throw new HttpError(400, 'A storeId is required.');
      const store = await getRecordByKey(pb, 'stores', payload.storeId);
      if (caller.role === 'manager' && (!caller.group_id || caller.group_id !== store.groupId)) {
        throw new HttpError(403, 'You do not have access to this store.');
      }
      if (store.platform !== 'WooCommerce') throw new HttpError(400, 'Only WooCommerce stores are supported by this sync endpoint.');

      if (action === 'syncStore') {
        const result = await syncWooStore(pb, store);
        return jsonResponse(200, { ok: true, ...result });
      }
      if (action === 'testWooConnection') {
        return jsonResponse(200, await testWooConnection(pb, store));
      }
      return jsonResponse(200, await disconnectStore(pb, payload.storeId));
    }

    throw new HttpError(404, `Unknown sync action: ${String(action || '')}`);
  } catch (error) {
    const statusCode = error instanceof HttpError ? error.statusCode : 500;
    console.error('Digital Hub Netlify function failed:', error?.message || error);
    return jsonResponse(statusCode, { ok: false, message: error?.message || 'The server action failed.' });
  }
}
