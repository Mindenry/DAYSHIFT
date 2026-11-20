"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clientApi } from "@/lib/api";

export function AdminLoginForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <form
      className="mt-8 space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setBusy(true);
        setError(null);
        try {
          const user = await clientApi<{ kind: string }>("/auth/staff/login", {
            method: "POST",
            body: JSON.stringify({ email: data.get("email"), password: data.get("password") }),
          });
          if (user.kind !== "staff") throw new Error("Staff access required");
          router.push("/");
          router.refresh();
        } catch (loginError) {
          setError(loginError instanceof Error ? loginError.message : "Could not sign in");
          setBusy(false);
        }
      }}
    >
      {error && <div role="alert" className="border border-danger/30 bg-danger-soft p-3 text-xs text-danger">{error}</div>}
      <div>
        <label htmlFor="email" className="label">Work email</label>
        <input id="email" name="email" type="email" required autoComplete="username" className="field" placeholder="you@dayshift.example" />
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="field" />
      </div>
      <button type="submit" disabled={busy} className="a-btn w-full">
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
