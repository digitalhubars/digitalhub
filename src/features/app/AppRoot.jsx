'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { doc, onSnapshot } from '../../lib/firebase/client';
import { parseRoute } from '../../config/navigation';
import { AppProvider } from '../../context/AppContext';
import { authMessage, ensureProfile, watchAuth } from '../../lib/auth';
import { fb, firebaseConfigured } from '../../lib/firebase/client';
import AccountBlocked from '../auth/AccountBlocked';
import AuthShell from '../auth/AuthShell';
import SetupNotice from '../auth/SetupNotice';
import AppShell from './AppShell';
import { Loading } from './ClientApp';

// Signed-in area: waits for Firebase Auth and the user's profile, then draws the app.
export default function AppRoot() {
  const pathname = usePathname();
  const router = useRouter();
  const [authUser, setAuthUser] = useState(undefined); // undefined = still checking
  const [profile, setProfile] = useState(undefined);
  const [error, setError] = useState('');

  useEffect(() => (firebaseConfigured ? watchAuth((u) => setAuthUser(u)) : undefined), []);

  // Live profile: role changes made by an admin apply right away.
  useEffect(() => {
    if (!authUser) {
      setProfile(authUser === null ? null : undefined);
      return undefined;
    }
    // Creates the profile on first sign-in, and promotes the owner once their email is confirmed.
    ensureProfile(authUser.displayName || '').catch((err) => setError(authMessage(err)));
    return onSnapshot(
      doc(fb().db, 'users', authUser.uid),
      (snap) => {
        if (snap.exists()) setProfile({ id: snap.id, ...snap.data() });
      },
      (err) => setError(authMessage(err)),
    );
  }, [authUser]);

  // Access gate: signed-out → sign-in page; managers and clients → their own dashboard only.
  const env = pathname.split('/').filter(Boolean)[0];
  const wrongDashboard = profile && profile.role !== 'admin' && env !== profile.role;
  useEffect(() => {
    if (authUser === null) router.replace(`/signin?next=${encodeURIComponent(pathname)}`);
    else if (wrongDashboard) router.replace(`/${profile.role}`);
  }, [authUser, wrongDashboard, profile, pathname, router]);

  const route = useMemo(() => parseRoute(pathname, profile?.role || 'client'), [pathname, profile?.role]);
  const navigate = useCallback((path, { replace = false } = {}) => (replace ? router.replace(path) : router.push(path)), [router]);

  if (!firebaseConfigured) {
    return (
      <AuthShell title="Firebase isn’t connected yet">
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
  if (!profile || wrongDashboard) return <Loading />;

  return (
    <AppProvider profile={profile} route={route} navigate={navigate}>
      <AppShell />
    </AppProvider>
  );
}
