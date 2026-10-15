'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { parseRoute } from '../../config/navigation';
import { AppProvider } from '../../context/AppContext';
import { authMessage, ensureProfile, watchAuth } from '../../lib/auth';
import { pb, pbConfigured } from '../../lib/pocketbase';
import { hasAnyRoleAccess, useRoleAccess } from '../../lib/roles';
import AccountBlocked from '../auth/AccountBlocked';
import AuthShell from '../auth/AuthShell';
import NoAccessPage from '../auth/NoAccessPage';
import SetupNotice from '../auth/SetupNotice';
import AppShell from './AppShell';
import { Loading } from './ClientApp';

// Signed-in area: waits for PocketBase auth and the user's profile, then draws the app.
export default function AppRoot() {
  const pathname = usePathname();
  const router = useRouter();
  const [authUser, setAuthUser] = useState(undefined); // undefined = still checking
  const [profile, setProfile] = useState(undefined);
  const [error, setError] = useState('');
  const { permissions: rolePermissions, loading: roleAccessLoading } = useRoleAccess(profile?.role);

  useEffect(() => (pbConfigured ? watchAuth((u) => setAuthUser(u)) : undefined), []);

  // Live profile: role changes made by an admin apply right away.
  useEffect(() => {
    if (!authUser) {
      setProfile(authUser === null ? null : undefined);
      return undefined;
    }
    let active = true;
    let unsubscribe;
    const loadProfile = async () => {
      try {
        await ensureProfile(authUser.displayName || '');
        const record = await pb.collection('users').getOne(authUser.id);
        if (active) setProfile(record);
        const stop = await pb.collection('users').subscribe(authUser.id, ({ record: updated }) => {
          if (active) setProfile(updated);
        });
        if (active) unsubscribe = stop;
        else stop();
      } catch (err) {
        if (active) setError(authMessage(err));
      }
    };
    loadProfile();
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [authUser]);

  // Access gate: signed-out → sign-in page; managers and clients → their own dashboard only.
  const env = pathname.split('/').filter(Boolean)[0];
  const wrongDashboard = profile?.role && profile.role !== 'admin' && env !== profile.role;
  useEffect(() => {
    if (authUser === null) router.replace(`/signin?next=${encodeURIComponent(pathname)}`);
    else if (wrongDashboard) router.replace(`/${profile.role}`);
  }, [authUser, wrongDashboard, profile, pathname, router]);

  const route = useMemo(() => parseRoute(pathname, profile?.role || 'staff'), [pathname, profile?.role]);
  const navigate = useCallback((path, { replace = false } = {}) => (replace ? router.replace(path) : router.push(path)), [router]);

  if (!pbConfigured) {
    return (
      <AuthShell title="PocketBase isn’t connected yet">
        <SetupNotice />
      </AuthShell>
    );
  }
  if (error) {
    return (
      <AuthShell title="Couldn’t load your account">
        <AccountBlocked title="Something went wrong" body={error} />
      </AuthShell>
    );
  }
  if (profile && !profile.role) return <NoAccessPage />;
  if (profile?.role && roleAccessLoading) return <Loading />;
  if (profile?.role && !hasAnyRoleAccess(profile.role, rolePermissions)) return <NoAccessPage />;
  if (!profile || wrongDashboard) return <Loading />;

  return (
    <AppProvider profile={profile} route={route} navigate={navigate} rolePermissions={rolePermissions}>
      <AppShell />
    </AppProvider>
  );
}
