'use client';

import { Lock, LogOut } from 'lucide-react';
import Button from '../../components/ui/Button';
import { signOutAndLeave } from '../../lib/session';
import { ui } from '../../styles/ui';

// Shown when an account can't open its dashboard yet (suspended, or not linked by an admin).
export default function AccountBlocked({ title, body, showSignOut = true }) {
  return (
    <div className={`${ui.card} mx-auto mt-10 max-w-md p-6 text-center`}>
      <Lock className="mx-auto text-gray-400" size={28} />
      <h1 className={`mt-3 text-lg font-semibold ${ui.h}`}>{title}</h1>
      <p className={`mt-1 text-sm ${ui.muted}`}>{body}</p>
      {showSignOut && (
        <Button className="mt-5" onClick={signOutAndLeave}>
          <LogOut size={15} /> Sign out
        </Button>
      )}
    </div>
  );
}
