import { SignUp } from '@clerk/nextjs';

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-4">
        <SignUp afterSignUpUrl="/dashboard" redirectUrl="/dashboard" />
      </div>
    </div>
  );
}
