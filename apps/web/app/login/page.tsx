import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/account";
  return (
    <div className="grid min-h-[70vh] lg:grid-cols-2">
      <div className="hidden bg-ink lg:block">
        { }
        <img src="/images/editorial-03.jpg" alt="" className="h-full w-full object-cover opacity-80" />
      </div>
      <div className="flex items-center justify-center px-5 py-16 md:px-12">
        <div className="w-full max-w-sm">
          <p className="overline text-muted">Your account</p>
          <h1 className="mt-2 font-display text-5xl">Sign in</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            View orders, manage returns, save pieces and track your loyalty points.
          </p>
          <LoginForm next={next} />
          <p className="mt-6 text-sm">
            New to DAYSHIFT?{" "}
            <Link href={`/register?next=${encodeURIComponent(next)}`} className="underline">Create an account</Link>
          </p>
          <p className="mt-2 text-sm text-muted">
            <Link href="/forgot-password" className="underline">Forgot your password?</Link>
          </p>
          <div className="mt-8 border-t border-line pt-5 text-xs leading-relaxed text-muted">
            <p className="font-medium uppercase tracking-[0.1em] text-ink">Demo account</p>
            <p className="mt-2">customer@dayshift.example</p>
            <p>Customer1234!Pass</p>
          </div>
        </div>
      </div>
    </div>
  );
}
