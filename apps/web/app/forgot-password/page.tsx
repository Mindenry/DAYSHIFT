import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Reset your password — DAYSHIFT", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <div className="wrap py-20">
      <div className="mx-auto max-w-sm">
        <p className="overline text-muted">Account</p>
        <h1 className="mt-2 font-display text-4xl">Reset your password</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Enter the email associated with your account and we&apos;ll send a reset link.
        </p>
        <ForgotPasswordForm />
        <Link href="/login" className="mt-6 block text-center text-xs underline">Back to sign in</Link>
      </div>
    </div>
  );
}
