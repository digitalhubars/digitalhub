# Digital Hub CRM

Next.js 14 + Tailwind front end using PocketBase for auth and data.

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start PocketBase on port 8090 and set the app URL in `.env.local`:
   ```bash
   NEXT_PUBLIC_PB_URL=http://127.0.0.1:8090
   ```
3. Start the app:
   ```bash
   npm run dev
   ```

## Commands

```bash
npm install
npm run dev
npm run build
```

## PocketBase role setup

Create or repair the collections, API rules, and default `admin`, `manager`, and `staff` page permissions with the idempotent setup script. It only reads superuser credentials from the environment; never put them in `.env.local`, frontend code, or any `NEXT_PUBLIC_*` variable.

PowerShell:

```powershell
$env:PB_URL = "https://pocketbase-railway-production-b1cb.up.railway.app"
$env:PB_ADMIN_EMAIL = "your-superuser-email"
$env:PB_ADMIN_PASSWORD = "your-superuser-password"
node scripts/setup-pocketbase.mjs
```

Bash:

```bash
PB_URL="https://your-pocketbase-host" PB_ADMIN_EMAIL="your-superuser-email" PB_ADMIN_PASSWORD="your-superuser-password" node scripts/setup-pocketbase.mjs
```

The setup script logs in through PocketBase's `_superusers` collection. It adds/repairs fields and rules, seeds missing role/page rows, preserves existing records and valid manager/staff permissions, enforces admin-full/manager-no-delete/staff-view-only invariants, and prints a change summary. Review and run it only from a trusted machine with superuser access.

## App routes and collections

The static app exports `/`, `/signin`, `/signup`, `/forgot-password`, and these signed-in routes under `/admin`, `/manager`, and `/staff`: the dashboard, products, orders, customers, clients, integrations, settings, profile, password, and role access. Settings subroutes include general, users, clients, groups, syncing, webhooks, my access, notifications, appearance, security, activity, and support; route access is controlled by `role_access`.

The app uses the PocketBase collections `users`, `role_access`, `workspace`, `groups`, `clients`, `stores`, `products`, `orders`, `customers`, `activity`, `notifications`, and `storeSecrets`.

## WooCommerce Netlify Functions

The Sync button sends `POST /.netlify/functions/digital-hub` with an action, store ID, and the signed-in user's PocketBase token. It no longer calls a nonexistent PocketBase `/api/digital-hub/...` route. This works with the static export (`output: 'export'`) because the server logic runs in Netlify Functions, not Next.js route handlers. Netlify also deploys `woocommerce-webhook` and `woo-scheduled-sync`, scheduled every 15 minutes. Set these in **Netlify → Site configuration → Environment variables** (server-side only; do not prefix them with `NEXT_PUBLIC_`):

| Variable | Purpose |
| --- | --- |
| `PB_URL` | PocketBase base URL, e.g. `https://pocketbase-railway-production-b1cb.up.railway.app` |
| `PB_SERVICE_EMAIL` | Dedicated active PocketBase Auth user with role `admin` |
| `PB_SERVICE_PASSWORD` | Password for that service user |
| `WC_STORE_<STORE_SUFFIX>_CONSUMER_KEY` | WooCommerce REST API consumer key for one store |
| `WC_STORE_<STORE_SUFFIX>_CONSUMER_SECRET` | WooCommerce REST API consumer secret for one store |
| `WC_STORE_<STORE_SUFFIX>_WEBHOOK_SECRET` | HMAC secret configured on each WooCommerce webhook for that store |

`STORE_SUFFIX` is the store's record key uppercased with every non-alphanumeric character replaced by `_`. The Integrations editor shows the required variable names after the store is saved. The public browser variable `NEXT_PUBLIC_PB_URL` is still required for direct PocketBase reads; it is not used for any server credential.

In WooCommerce, create webhooks for product, order, and customer created/updated/deleted topics. Use the URL shown under Settings → Webhooks and set the webhook secret to the value of that store's `WC_STORE_<STORE_SUFFIX>_WEBHOOK_SECRET`. Redeploy/rebuild Netlify after changing environment variables. The secret itself is never entered into or stored by the browser.

## Notes

- The previous backend and config values were removed.
- The app is now running against PocketBase for auth and the shared CRM datastore.
- Configure the PocketBase collections and API rules described in the deployment setup before inviting users.
- The static export is written to `out`; configure Netlify to publish that directory and set `NEXT_PUBLIC_PB_URL` for the build.
- WooCommerce credentials are read only by Netlify Functions from server-side environment variables; configure webhook topics as described above.
