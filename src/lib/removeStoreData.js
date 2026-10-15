import { deleteRecord, pb } from './pocketbase';

// Admin fallback for disconnecting a store when its external sync endpoint is unavailable.
export async function removeStoreData(storeId) {
  for (const collectionName of ['products', 'orders', 'customers']) {
    const records = await pb.collection(collectionName).getFullList({
      filter: pb.filter('storeId = {:storeId}', { storeId }),
    });
    await Promise.all(records.map((record) => pb.collection(collectionName).delete(record.id)));
  }

  const clients = await pb.collection('clients').getFullList();
  await Promise.all(
    clients
      .filter((client) => (client.storeIds || []).includes(storeId))
      .map((client) => pb.collection('clients').update(client.id, {
        storeIds: client.storeIds.filter((id) => id !== storeId),
      })),
  );

  await deleteRecord('stores', storeId);
  await deleteRecord('storeSecrets', storeId);
}
