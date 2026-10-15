# Digital Hub CRM

Next.js 14 + Tailwind front end using PocketBase for auth and data.

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start PocketBase on port 8090 and set the app URL in `.env.local`:
   ```bash
   NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
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

## Notes

- The previous backend and config values were removed.
- The app is now running against PocketBase for auth and the shared CRM datastore.
- WooCommerce sync features should be connected through the PocketBase backend once the relevant collections and server logic are set up.
