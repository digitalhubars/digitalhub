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

## Notes

- The previous backend and config values were removed.
- The app is now running against PocketBase for auth and the shared CRM datastore.
- Configure the PocketBase collections and API rules described in the deployment setup before inviting users.
- The static export is written to `out`; configure Netlify to publish that directory and set `NEXT_PUBLIC_PB_URL` for the build.
- WooCommerce sync requires custom PocketBase server routes at `/api/digital-hub/{action}`.
