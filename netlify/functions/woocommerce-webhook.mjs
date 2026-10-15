import { applyWooWebhook, verifyWooSignature } from './_shared/woocommerce.mjs';
import { getRecordByKey, getServicePocketBase, HttpError, jsonResponse } from './_shared/pocketbase.mjs';

function header(event, name) {
  const key = name.toLowerCase();
  return event.headers?.[key] || event.headers?.[name] || '';
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') return jsonResponse(405, { ok: false, message: 'Use POST for WooCommerce webhooks.' });

  try {
    const storeId = event.queryStringParameters?.storeId;
    if (!storeId) throw new HttpError(400, 'Webhook URL must include a storeId query parameter.');

    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64')
      : Buffer.from(event.body || '', 'utf8');
    const signature = header(event, 'x-wc-webhook-signature');
    if (!verifyWooSignature(rawBody, signature, storeId)) {
      throw new HttpError(401, 'WooCommerce webhook signature is invalid.');
    }

    let payload;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      throw new HttpError(400, 'Webhook body must be valid JSON.');
    }

    const topic = header(event, 'x-wc-webhook-topic');
    const pb = await getServicePocketBase();
    const store = await getRecordByKey(pb, 'stores', storeId);
    if (store.platform !== 'WooCommerce') throw new HttpError(400, 'Webhook store is not a WooCommerce store.');
    const result = await applyWooWebhook(pb, store, topic, payload);
    return jsonResponse(200, result);
  } catch (error) {
    const statusCode = error instanceof HttpError ? error.statusCode : 500;
    console.error('WooCommerce webhook failed:', error?.message || error);
    return jsonResponse(statusCode, { ok: false, message: error?.message || 'Webhook processing failed.' });
  }
}
