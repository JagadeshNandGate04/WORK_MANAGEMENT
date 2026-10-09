import { Suspense } from 'react';
import SignupPage from '../components/SignUp';

export default function SignupRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#e8efe6]" />}>
      <SignupPage />
    </Suspense>
  );
}
