"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, ShieldAlert } from "lucide-react";
import { clientApi, money } from "@/lib/api";

export function SandboxPayment({
  reference,
  orderNumber,
  email,
  amount,
}: {
  reference: string;
  orderNumber: string;
  email: string;
  amount: string;
}) {
  const [card, setCard] = useState("4242 4242 4242 4242");
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("12/29");
  const [cvc, setCvc] = useState("123");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const confirm = async (outcome: "success" | "failure") => {
    setBusy(true);
    setError(null);
    try {
      await clientApi("/payments/sandbox/confirm", {
        method: "POST",
        body: JSON.stringify({ reference, outcome, email }),
      });
      if (outcome === "success") {
        router.push(`/checkout/confirmation?order=${encodeURIComponent(orderNumber)}`);
      } else {
        setError("The sandbox payment was declined. No stock has been allocated and no money moved.");
        setBusy(false);
      }
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : "Payment could not be completed.");
      setBusy(false);
    }
  };

  if (!reference) {
    return (
      <div className="wrap py-24 text-center">
        <h1 className="font-display text-4xl">Payment reference missing</h1>
        <p className="mt-3 text-sm text-muted">Return to your bag and start checkout again.</p>
        <Link href="/cart" className="btn btn-outline mt-8">Return to bag</Link>
      </div>
    );
  }

  return (
    <div className="wrap py-10 md:py-16">
      <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="overline text-muted">Step 2 of 2</p>
          <h1 className="mt-2 font-display text-4xl md:text-6xl">Payment</h1>
          <div className="mt-5 flex items-start gap-3 border border-line bg-sand/40 p-4">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Sandbox payment — no real charge</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                This is a local payment simulator for the demonstration. It never contacts a card
                network, and no card details are stored. Use the prefilled test card or any values.
              </p>
            </div>
          </div>

          {error && <div role="alert" className="mt-5 border border-sale/40 bg-sale/5 p-4 text-sm text-sale">{error}</div>}

          <form className="mt-8 border border-line p-6" onSubmit={(event) => { event.preventDefault(); void confirm("success"); }}>
            <div>
              <label htmlFor="card" className="label">Card number</label>
              <input id="card" value={card} onChange={(e) => setCard(e.target.value)} className="field font-mono tracking-wider" inputMode="numeric" autoComplete="cc-number" />
            </div>
            <div className="mt-4">
              <label htmlFor="card-name" className="label">Name on card</label>
              <input id="card-name" value={name} onChange={(e) => setName(e.target.value)} className="field" placeholder="Elena Marchetti" autoComplete="cc-name" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="expiry" className="label">Expiry</label>
                <input id="expiry" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="field" placeholder="MM/YY" autoComplete="cc-exp" />
              </div>
              <div>
                <label htmlFor="cvc" className="label">CVC</label>
                <input id="cvc" value={cvc} onChange={(e) => setCvc(e.target.value)} className="field" placeholder="123" autoComplete="cc-csc" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted">
              <Lock className="h-3.5 w-3.5" /> Test card 4242 — expiry and CVC are not validated.
            </div>
            <button type="submit" disabled={busy} className="btn btn-primary mt-6 w-full">
              {busy ? "Processing…" : `Pay ${money(amount)}`}
            </button>
            <button
              type="button"
              onClick={() => confirm("failure")}
              disabled={busy}
              className="mt-3 w-full text-xs underline text-muted"
            >
              Simulate a declined payment
            </button>
          </form>
        </div>

        <aside className="lg:pt-16">
          <div className="border border-line p-6">
            <p className="overline">Order summary</p>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Order</dt><dd>{orderNumber}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Email</dt><dd className="truncate pl-4 text-right">{email}</dd></div>
              <div className="flex justify-between border-t border-line pt-3 text-base"><dt>Total due</dt><dd>{money(amount)}</dd></div>
            </dl>
            <p className="mt-5 text-[11px] leading-relaxed text-muted">
              On success, stock is committed, the order moves to paid and a confirmation email is
              queued through the background worker.
            </p>
            <Link href="/cart" className="mt-6 block text-center text-xs underline">Cancel and return to bag</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
