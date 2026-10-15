import { signOut } from './auth';

// Ends the Firebase session and does a full page load so no signed-in state lingers.
export async function signOutAndLeave() {
  await signOut();
  window.location.assign('/signin?message=signed-out');
}
