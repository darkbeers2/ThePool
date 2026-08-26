import { signInWithGoogle } from "./actions";
import { CredentialsLoginForm } from "./CredentialsLoginForm";

function googleAuthErrorMessage(error: string | undefined): string | null {
  if (!error) {
    return null;
  }
  if (error === "AccessDenied") {
    return "This Google account is not registered for The Pool. Ask the commissioner to add your email.";
  }
  return "Google sign-in failed. Try again or use site credentials.";
}

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const googleConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
  const googleError = googleAuthErrorMessage(searchParams?.error);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-pool-navy to-slate-900 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700/80 bg-pool-slate/80 p-8 shadow-xl backdrop-blur">
        <h1 className="text-center text-2xl font-semibold tracking-tight">
          The Pool
        </h1>
        <p className="mt-2 text-center text-sm text-slate-400">
          College football — five ATS picks each week
        </p>

        <div className="mt-8 flex flex-col gap-6">
          <section>
            <h2 className="text-sm font-medium text-slate-300">
              Site credentials
            </h2>
            <CredentialsLoginForm />
          </section>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-pool-slate/80 px-2 text-slate-500">or</span>
            </div>
          </div>

          <section>
            <h2 className="text-sm font-medium text-slate-300">
              Google account
            </h2>
            <div className="mt-3">
              {googleError ? (
                <div className="mb-3 rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                  {googleError}
                </div>
              ) : null}
              {googleConfigured ? (
                <form action={signInWithGoogle}>
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow hover:bg-slate-100"
                  >
                    <GoogleMark />
                    Continue with Google
                  </button>
                </form>
              ) : (
                <p className="rounded-lg border border-amber-600/40 bg-amber-950/40 px-3 py-2 text-center text-sm text-amber-200">
                  Set{" "}
                  <code className="text-xs">GOOGLE_CLIENT_ID</code> and{" "}
                  <code className="text-xs">GOOGLE_CLIENT_SECRET</code> in{" "}
                  <code className="text-xs">.env.local</code>, then restart the
                  dev server.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}
