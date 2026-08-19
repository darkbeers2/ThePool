"use client";

import { useFormState } from "react-dom";
import { signInWithCredentials } from "./actions";

type FormState = { error?: string } | undefined;

export function CredentialsLoginForm() {
  const [state, formAction] = useFormState<FormState, FormData>(
    async (_prev, formData) => signInWithCredentials(formData),
    undefined,
  );

  return (
    <form action={formAction} className="mt-3 space-y-3">
      {state?.error ? (
        <div className="rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {state.error}
        </div>
      ) : null}
      <label className="block text-sm">
        <span className="text-slate-400">Username or email</span>
        <input
          name="username"
          type="text"
          autoComplete="username"
          required
          className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
      </label>
      <label className="block text-sm">
        <span className="text-slate-400">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
      </label>
      <button
        type="submit"
        className="w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-sky-500"
      >
        Sign in
      </button>
    </form>
  );
}
