'use client';

import { useEffect } from 'react';
import Logo from '../../components/layout/Logo';
import { ui } from '../../styles/ui';

// Reads the theme saved by the app, falling back to the device setting.
function applySavedTheme() {
  let pref = 'system';
  try {
    pref = JSON.parse(localStorage.getItem('digital-hub:workspace') || '{}')?.data?.themePref || 'system';
  } catch {
    // ignore
  }
  const dark = pref === 'dark' || (pref === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

// Centered card used by every signed-out screen.
export default function AuthShell({ title, description, children, footer }) {
  useEffect(applySavedTheme, []);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gray-50 px-4 py-10 font-sans text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100">
      <div className="mb-6">
        <Logo name="Digital Hub" />
      </div>
      <div className={`${ui.card} w-full max-w-sm p-6 sm:p-7`}>
        <h1 className={`text-lg font-semibold tracking-tight ${ui.h}`}>{title}</h1>
        {description && <p className={`mt-1 text-sm ${ui.muted}`}>{description}</p>}
        <div className="mt-5">{children}</div>
      </div>
      {footer && <p className={`mt-5 text-sm ${ui.muted}`}>{footer}</p>}
    </div>
  );
}
