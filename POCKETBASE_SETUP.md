# PocketBase Setup

## Collections and fields

Create `users` as an **Auth collection**. PocketBase supplies the record ID, email, password, and system timestamps. Add these custom fields:

| Field | Type | Required / options |
| --- | --- | --- |
| `full_name` | Text | Optional |
| `phone` | Text | Optional |
| `role` | Select | Required; `admin`, `manager`, `client` |
| `group_id` | Text | Optional; store-group `recordKey` |
| `client_id` | Text | Optional; client `recordKey` |
| `status` | Select | Required; `active`, `suspended` |
| `created_at` | Date | Optional |

Password confirmation is submitted as `passwordConfirm`; it is not a stored field. Do not create `recordKey` on `users`: its PocketBase record ID is the auth ID.

For each regular collection below, add `recordKey` as a **required unique Text** field. This is the app's stable ID; PocketBase's own `id` stays internal. Use the listed fields in addition to `recordKey`.

| Collection | Fields and PocketBase types |
| --- | --- |
| `workspace` | `workspaceName` Text, `supportEmail` Email, `currency` Text, `timezone` Text, `dateFormat` Text, `lowStockThreshold` Number, `syncFrequency` Text, `conflictRule` Text, `syncFields` JSON, `autoRetry` Bool, `webhookUrl` URL or Text, `webhookSecret` Text, `notify` JSON, `twoFactor` Bool |
| `groups` | `name` Text, `storeIds` JSON (string array of store `recordKey`s), `sample` Bool |
| `clients` | `company` Text, `contact` Text, `email` Email, `phone` Text, `status` Select (`active`, `invited`, `suspended`), `storeIds` JSON (string array), `permissions` JSON, `createdAt` Number (milliseconds), `sample` Bool |
| `stores` | `name` Text, `platform` Select (`Shopify`, `WooCommerce`, `Amazon`, `eBay`, `TikTok Shop`), `url` URL or Text, `groupId` Text, `status` Select (`active`, `paused`), `health` Select (`checking`, `connected`, `slow`, `error`, `expiring`, `manual`), `lastSync` Number, `keyHint` Text, `accountId` Text, `region` Text, `syncFrequency` Text, `webhooks` Text, `createdAt` Number, `sample` Bool |
| `products` | `storeId` Text, `title` Text, `category` Text, `price` Number, `stock` Number, `sku` Text, `externalId` Text (platform ID; not the app key), `status` Select (`active`, `draft`, `out_of_stock`), `syncState` Text, `syncError` Text, `pendingDelete` Bool, `updatedBy` Text, `editedAt` Number |
| `orders` | `number` Text, `storeId` Text, `customerId` Text, `items` JSON, `subtotal` Number, `shipping` Number, `total` Number, `status` Text, `placedAt` Number, `syncState` Text, `syncError` Text, `updatedBy` Text, `editedAt` Number |
| `customers` | `storeId` Text, `name` Text, `email` Email or Text |
| `activity` | `at` Number, `actor` Text, `actorId` Text, `type` Text, `text` Text |
| `notifications` | `at` Number, `text` Text, `tone` Text, `read` Bool |
| `storeSecrets` | `url` URL or Text, `token` Text (Shopify), `consumerKey` Text, `consumerSecret` Text (WooCommerce), `updatedAt` Number |

The app computes customer `orderCount` and `spent` from orders; those are not stored fields. Timestamp numbers in business collections are milliseconds since the Unix epoch. Make `recordKey` unique on every regular collection.

## API rules

Set these rules on the `users` Auth collection:

- Auth rule: `status = "active"`
- List rule: `@request.auth.id != "" && (@request.auth.role = "admin" || id = @request.auth.id)`
- View rule: `@request.auth.id != "" && (@request.auth.role = "admin" || id = @request.auth.id)`
- Create rule: `(@request.auth.id != "" && @request.auth.role = "admin") || (@request.body.role = "client" && @request.body.status = "active" && @request.body.group_id = "" && @request.body.client_id = "")`
- Update rule: `@request.auth.id != "" && (@request.auth.role = "admin" || (id = @request.auth.id && @request.body.role = role && @request.body.group_id = group_id && @request.body.client_id = client_id && @request.body.status = status))`
- Delete rule: `@request.auth.role = "admin" && id != @request.auth.id`

For the other collections, use admin-only list/view/create/update/delete rules as the safe default:

- List and view: `@request.auth.role = "admin"`
- Create, update, and delete: `@request.auth.role = "admin"`

This is intentionally restrictive. The frontend currently filters manager/client records in the browser, but the stored text IDs and JSON `storeIds` do not provide server-enforced per-store authorization. Do not replace these rules with “any authenticated user” for customer/order data in production. To enable manager/client data access safely, add relation-backed or materialized per-record ACL fields and matching PocketBase rules first. The `storeSecrets` collection must remain admin-only; the current browser upsert reads the existing secret record, so its view rule cannot be write-only with the current implementation.

After creating the first account, set its `role` to `admin` in PocketBase Admin UI. Public sign-up intentionally creates `client` accounts only; the browser must not be allowed to promote itself.

## Netlify

Set the build command to `npm run build`, the publish directory to `out`, and define `NEXT_PUBLIC_PB_URL` in the Netlify build environment. This is a Next.js static export; PocketBase is called from the browser. Rebuild after changing the variable because `NEXT_PUBLIC_*` values are embedded at build time.

WooCommerce connection, test, sync, and disconnect actions also call `/api/digital-hub/{action}`. This repository contains no PocketBase extension or server route for those actions; add and deploy that backend separately before enabling live store sync.
