# PocketBase Setup

The schema and API rules below are created/repaired by [`scripts/setup-pocketbase.mjs`](scripts/setup-pocketbase.mjs). It requires `PB_URL`, `PB_ADMIN_EMAIL`, and `PB_ADMIN_PASSWORD` in the process environment and authenticates through `_superusers`. It never deletes records or collections. The permission model is role-wide: editing the staff page rows affects all staff, not a single staff account.

## Collections

Create `users` as an **Auth collection**. PocketBase supplies `id`, `email`, `password`, and system timestamps. The script adds these custom fields:

| Field | Type | Required / values |
| --- | --- | --- |
| `full_name` | Text | Optional |
| `phone` | Text | Optional |
| `title` | Text | Optional |
| `role` | Select | Optional; `admin`, `manager`, `staff` |
| `group_id` | Text | Optional; store-group `recordKey` |
| `client_id` | Text | Optional; client `recordKey` |
| `status` | Select | Optional; `active`, `suspended` |
| `created_at` | Date | Optional |

Password confirmation is submitted as `passwordConfirm`; it is not stored. Public sign-up omits `role`, so a new user stays roleless until an admin assigns a role. The setup script migrates legacy `client` auth roles to `staff` and fills missing statuses with `active`.

Each base collection except `role_access` has a required unique Text `recordKey`, the app's stable ID. PocketBase's own `id` remains internal. Other fields:

| Collection | Fields and PocketBase types |
| --- | --- |
| `role_access` | `role` Select (`admin`, `manager`, `staff`), `page` Text, `canView` Bool, `canEdit` Bool, `canDelete` Bool |
| `workspace` | `workspaceName` Text, `supportEmail` Text, `currency` Text, `timezone` Text, `dateFormat` Text, `lowStockThreshold` Number, `syncFrequency` Text, `conflictRule` Text, `syncFields` JSON, `autoRetry` Bool, `webhookUrl` Text, `notify` JSON, `twoFactor` Bool |
| `groups` | `name` Text, `storeIds` JSON (array), `sample` Bool |
| `clients` | `company` Text, `contact` Text, `email` Text, `phone` Text, `status` Select (`active`, `invited`, `suspended`), `storeIds` JSON (array), `permissions` JSON, `createdAt` Number, `sample` Bool |
| `stores` | `name` Text, `platform` Select (`Shopify`, `WooCommerce`, `Amazon`, `eBay`, `TikTok Shop`), `url` Text, `groupId` Text, `status` Select (`active`, `paused`), `health` Select (`checking`, `connected`, `slow`, `error`, `expiring`, `manual`), `lastSync` Number, `keyHint` Text, `accountId` Text, `region` Text, `syncFrequency` Text, `webhooks` Text, `createdAt` Number, `sample` Bool |
| `products` | `storeId` Text, `title` Text, `category` Text, `price` Number, `stock` Number, `sku` Text, `externalId` Text (marketplace ID), `status` Select (`active`, `draft`, `out_of_stock`), `syncState` Text, `syncError` Text, `pendingDelete` Bool, `updatedBy` Text, `editedAt` Number, `sample` Bool |
| `orders` | `number` Text, `storeId` Text, `customerId` Text, `items` JSON, `subtotal` Number, `shipping` Number, `total` Number, `status` Text, `placedAt` Number, `syncState` Text, `syncError` Text, `updatedBy` Text, `editedAt` Number, `sample` Bool |
| `customers` | `storeId` Text, `name` Text, `email` Text, `orderCount` Number, `spent` Number, `sample` Bool |
| `activity` | `at` Number, `actor` Text, `actorId` Text, `type` Text, `text` Text |
| `notifications` | `at` Number, `text` Text, `tone` Text, `read` Bool |
| `storeSecrets` | `url` Text, `token` Text, `consumerKey` Text, `consumerSecret` Text, `updatedAt` Number |

Timestamp numbers in business collections are milliseconds since the Unix epoch. Customer `orderCount` and `spent` are computed by the app and may be omitted from stored records.

## API Rules

The setup script applies these users Auth collection rules:

- Auth: `status = "active"`
- List and view: `@request.auth.id != "" && (@request.auth.role = "admin" || id = @request.auth.id)`
- Create: `@request.body.role:isset = false`
- Update: admin, or own record with role, group, client, and status unchanged
- Delete: admin only

`role_access` is list/view-readable by logged-in users and writable/deletable by admins only. Data collections are readable by logged-in, active users with a non-empty role; create/update requires admin or manager; delete is admin-only. `storeSecrets` is admin-only for every operation.

The current schema stores group/client/store assignments as text IDs and JSON arrays. Therefore, data read rules intentionally follow the requested logged-in-user rule and do **not** enforce per-store row isolation; frontend filters are only UX. If staff or manager accounts must not read other tenants' records, add relation-backed ACL fields and tighten the API rules before production use. Keep `storeSecrets` admin-only.

After running setup, assign the first account `admin` in PocketBase Admin UI. Use the admin Role Access page to assign roles and configure `role_access` rows. Staff can only view pages whose `canView` is enabled; manager deletion and staff edits/deletes are prohibited by both the app and setup rules.

## Netlify and WooCommerce

Set build command `npm run build`, publish directory `out`, and `NEXT_PUBLIC_PB_URL` in Netlify's build environment. This is a Next.js static export; PocketBase is called from the browser. Rebuild after changing the variable because `NEXT_PUBLIC_*` values are embedded at build time.

Add these **server-side** Netlify variables; do not use the `NEXT_PUBLIC_` prefix:

- `PB_URL`: PocketBase base URL.
- `PB_SERVICE_EMAIL` and `PB_SERVICE_PASSWORD`: a dedicated active Auth user whose `role` is `admin`.
- `WC_STORE_<STORE_SUFFIX>_CONSUMER_KEY` and `WC_STORE_<STORE_SUFFIX>_CONSUMER_SECRET`: WooCommerce REST Read/Write keys per store.
- `WC_STORE_<STORE_SUFFIX>_WEBHOOK_SECRET`: random webhook secret per store.

`STORE_SUFFIX` is the saved store record key uppercased with non-alphanumeric characters replaced by underscores. The Integrations editor displays the variable names once a store has been saved. The browser calls `/.netlify/functions/digital-hub`; the other deployed functions are `/.netlify/functions/woocommerce-webhook` and `woo-scheduled-sync` (every 15 minutes).

In WooCommerce, create product, order, and customer create/update/delete webhooks pointed to the URL displayed under Settings → Webhooks. Set each webhook's secret to the matching `WC_STORE_<STORE_SUFFIX>_WEBHOOK_SECRET` value. The receiver validates `X-WC-Webhook-Signature` with HMAC-SHA256 before writing to PocketBase. Netlify environment changes require a new deploy.
