# Digital Hub CRM

Next.js 14 + Tailwind front end using a PocketBase-compatible local data layer.

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

- The Firebase backend and Firebase project config files were removed.
- The app is now running against a PocketBase-ready local datastore and authentication layer.
- WooCommerce sync features should be connected through the PocketBase backend once the relevant collections and server logic are set up.
