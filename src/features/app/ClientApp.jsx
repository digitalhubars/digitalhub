'use client';

import dynamic from 'next/dynamic';

// The app shell reads localStorage, the clock and matchMedia on first render,
// so it only renders in the browser (no server HTML to mismatch).
const AppRoot = dynamic(() => import('./AppRoot'), {
  ssr: false,
  loading: () => <Loading />,
});

export function Loading() {
  return (
    <div className="flex h-[100dvh] items-center justify-center bg-gray-50 text-sm text-gray-500 dark:bg-gray-950 dark:text-gray-400">
      Loading Digital Hub…
    </div>
  );
}

export default function ClientApp({ children }) {
  return (
    <>
      <AppRoot />
      {children}
    </>
  );
}
