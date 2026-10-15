import { Suspense } from 'react';
import SignInForm from '../../../features/auth/SignInForm';

export const metadata = { title: 'Sign in · Digital Hub' };

export default function SignInPage() {
  // useSearchParams() inside the form needs a Suspense boundary.
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
