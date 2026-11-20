import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Create an account", robots: { index: false } };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/account";
  return (
    <div className="wrap grid gap-12 py-16 lg:grid-cols-2 lg:py-24">
      <div className="max-w-lg">
        <p className="overline text-muted">Join DAYSHIFT</p>
        <h1 className="mt-2 font-display text-5xl leading-tight md:text-6xl">Create an account.</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          A quieter way to shop: saved addresses, one-place order history, free returns and points
          on every order. No noise.
        </p>
        <ul className="mt-8 space-y-3 border-t border-line pt-6 text-sm text-muted">
          <li>· Track orders and returns in one place</li>
          <li>· Save pieces to your wishlist</li>
          <li>· Earn points and move through tiers</li>
          <li>· Early access to limited runs</li>
        </ul>
        <p className="mt-8 text-sm">
          Already have an account?{" "}
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="underline">Sign in</Link>
        </p>
      </div>
      <div className="lg:pt-8">
        <RegisterForm next={next} />
        <div className="mt-8 border-t border-line pt-5 text-xs leading-relaxed text-muted">
          <p>This is a demonstration environment. Use a demo email and password only.</p>
          <p className="mt-2">Demo customer: customer@dayshift.example / Customer1234!Pass</p>
        </div>
      </div>
    </div>
  );
}
