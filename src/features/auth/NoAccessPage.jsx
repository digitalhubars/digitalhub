'use client';

import Button from '../../components/ui/Button';
import AuthShell from './AuthShell';
import { signOutAndLeave } from '../../lib/session';

export default function NoAccessPage() {
  return (
    <AuthShell title="No access yet">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">Ask an admin to assign your role and page permissions, then sign in again.</p>
        <Button variant="primary" className="w-full" onClick={signOutAndLeave}>Sign out</Button>
      </div>
    </AuthShell>
  );
}
