import { SignIn } from '@clerk/nextjs';

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-4">
        <SignIn afterSignInUrl="/dashboard" redirectUrl="/dashboard" />
      </div>
    </div>
  );
}
