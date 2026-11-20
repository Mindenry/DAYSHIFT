import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/session";
import { AdminLoginForm } from "@/components/admin-login-form";

export const metadata: Metadata = { title: "Sign in — DAYSHIFT Ops", robots: { index: false } };

export default async function LoginPage() {
  const session = await getStaffSession();
  if (session) redirect("/");
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="hidden flex-col justify-between bg-sidebar p-12 text-paper lg:flex">
        <div>
          <p className="text-sm font-semibold tracking-[0.3em]">DAYSHIFT</p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-paper/65">Commerce operations</p>
        </div>
        <div className="max-w-md">
          <h1 className="text-4xl font-normal leading-[1.1]">
            The business behind
            <br />
            everyday style.
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-paper/55">
            Orders, inventory, returns, customers and the numbers that matter — in one operational
            workspace.
          </p>
          <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-sidebar-line pt-6">
            <div>
              <dt className="text-[10px] uppercase tracking-[0.14em] text-paper/60">Channels</dt>
              <dd className="mt-1 text-sm">Storefront · Admin</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.14em] text-paper/60">Environment</dt>
              <dd className="mt-1 text-sm">Local · Sandbox payments</dd>
            </div>
          </dl>
        </div>
        <p className="text-[10px] text-paper/55">Demonstration environment. No real customer data or payments.</p>
      </div>
      <div className="flex items-center justify-center px-5 py-14">
        <div className="w-full max-w-sm">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Staff access</p>
          <h2 className="mt-2 text-3xl">Sign in to operations</h2>
          <p className="mt-3 text-sm text-muted">Use a staff account. Customer accounts cannot access this portal.</p>
          <AdminLoginForm />
          <div className="mt-8 border-t border-line pt-5 text-xs leading-relaxed text-muted">
            <p className="font-medium uppercase tracking-[0.1em] text-ink">Demo roles</p>
            <p className="mt-2">admin@dayshift.example · Admin1234!Pass</p>
            <p>warehouse@dayshift.example · Warehouse1234!Pass</p>
            <p>support@dayshift.example · Support1234!Pass</p>
          </div>
        </div>
      </div>
    </div>
  );
}
