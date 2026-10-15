import { getServicePocketBase, jsonResponse } from './_shared/pocketbase.mjs';
import { syncWooStore } from './_shared/woocommerce.mjs';

export const config = { schedule: '*/15 * * * *' };

export async function handler() {
  try {
    const pb = await getServicePocketBase();
    const stores = await pb.collection('stores').getFullList({
      filter: pb.filter('platform = {:platform} && status = {:status}', { platform: 'WooCommerce', status: 'active' }),
    });
    const results = [];

    for (const store of stores) {
      try {
        results.push({ storeId: store.recordKey, ok: true, ...(await syncWooStore(pb, store)) });
      } catch (error) {
        console.error(`Scheduled WooCommerce sync failed for ${store.recordKey}:`, error?.message || error);
        results.push({ storeId: store.recordKey, ok: false, message: error?.message || 'Sync failed.' });
      }
    }

    return jsonResponse(200, { ok: results.every((result) => result.ok), results });
  } catch (error) {
    console.error('Scheduled WooCommerce sync could not start:', error?.message || error);
    return jsonResponse(500, { ok: false, message: error?.message || 'Scheduled sync failed.' });
  }
}
