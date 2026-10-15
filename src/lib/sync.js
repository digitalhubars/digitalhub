import { PLATFORMS, platformSlug } from '../data/platforms';
import { delay } from './format';

// Shape of every CRM -> store change sent to the outbound webhook.
export function buildSyncPayload({ event, store, externalId, changes, user, queued }) {
  return {
    event,
    direction: 'crm_to_store',
    target: {
      platform: platformSlug(store.platform),
      api: PLATFORMS[store.platform].api,
      storeId: store.id,
      ...(store.accountId ? { accountId: store.accountId } : {}),
      externalId,
    },
    changes,
    delivery: queued ? 'queued_store_paused' : 'immediate',
    updatedBy: { id: user.id, role: user.role },
    sentAt: new Date().toISOString(),
  };
}

// Mock transport. Replace with a server-side POST that signs requests without exposing a secret to the browser.
// eslint-disable-next-line no-unused-vars
export async function sendToStore(payload, settings) {
  console.log('[Digital Hub] two-way sync payload →', payload);
  await delay(1100);
  return { ok: true };
}
