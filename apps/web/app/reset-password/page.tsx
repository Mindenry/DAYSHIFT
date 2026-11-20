import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  return (
    <div className="wrap py-20">
      <div className="mx-auto max-w-sm">
        <p className="overline text-muted">Account</p>
        <h1 className="mt-2 font-display text-4xl">Choose a new password</h1>
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="mt-6 border border-line p-5 text-sm text-muted">
            This reset link is missing its token.{" "}
            <Link href="/forgot-password" className="underline">Request a new link</Link>.
          </div>
        )}
      </div>
    </div>
  );
}
