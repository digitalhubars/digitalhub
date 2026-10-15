'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authMessage, ensureProfile, watchAuth } from '../../lib/auth';
import { pbConfigured } from '../../lib/pocketbase';
import { signOutAndLeave } from '../../lib/session';
import { Loading } from '../../features/app/ClientApp';
import AuthShell from '../../features/auth/AuthShell';
import Callout from '../../components/ui/Callout';
import Button from '../../components/ui/Button';

// "The dashboard": sends each user to the dashboard for their role.
export default function DashboardRedirect() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!pbConfigured) return router.replace('/signin');
    return watchAuth(async (user) => {
      if (!user) return router.replace('/signin');
      try {
        const { role } = await ensureProfile(user.displayName || '');
        return router.replace(`/${role || 'staff'}`);
      } catch (err) {
        return setError(authMessage(err));
      }
    });
  }, [router]);

  if (error) {
    return (
      <AuthShell title="Couldn’t open your dashboard">
        <div className="space-y-4">
          <Callout tone="danger">{error}</Callout>
          <div className="flex gap-2">
            <Button variant="primary" onClick={() => window.location.reload()}>
              Try again
            </Button>
            <Button onClick={signOutAndLeave}>Sign out</Button>
          </div>
        </div>
      </AuthShell>
    );
  }
  return <Loading />;
}
