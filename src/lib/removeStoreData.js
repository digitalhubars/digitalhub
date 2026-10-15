import { arrayRemove, collection, deleteDoc, doc, getDocs, query, where, writeBatch } from './pocketbase';
import { fb } from './pocketbase';

// Admin-only fallback for disconnecting a store when the sync functions aren't deployed.
// Deletes Digital Hub's copy only (plain deletes, not "pending" deletes, so nothing is
// ever deleted in the store itself).
export async function removeStoreData(storeId) {
  const { db } = fb();
  for (const name of ['products', 'orders', 'customers']) {
    const snap = await getDocs(query(collection(db, name), where('storeId', '==', storeId)));
    for (let i = 0; i < snap.docs.length; i += 450) {
      const batch = writeBatch(db);
      snap.docs.slice(i, i + 450).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }
  const clients = await getDocs(query(collection(db, 'clients'), where('storeIds', 'array-contains', storeId)));
  const batch = writeBatch(db);
  clients.docs.forEach((d) => batch.update(d.ref, { storeIds: arrayRemove(storeId) }));
  batch.delete(doc(db, 'stores', storeId));
  await batch.commit();
  await deleteDoc(doc(db, 'storeSecrets', storeId)).catch(() => {});
}
