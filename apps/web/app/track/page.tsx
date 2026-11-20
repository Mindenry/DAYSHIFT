import type { Metadata } from "next";
import { TrackOrder } from "@/components/track-order";

export const metadata: Metadata = {
  title: "Track your order — DAYSHIFT",
  description: "Look up your DAYSHIFT order and follow its journey.",
};

export default function TrackPage() {
  return (
    <div className="wrap py-12 md:py-20">
      <div className="max-w-md">
        <p className="overline text-muted">Order care</p>
        <h1 className="mt-2 font-display text-5xl">Track your order</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Enter your order number and the email used at checkout. Guest and account orders both work.
        </p>
      </div>
      <div className="mt-10">
        <TrackOrder />
      </div>
    </div>
  );
}
