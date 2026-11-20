"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Truck } from "lucide-react";
import { toast } from "sonner";
import { clientApi, money } from "@/lib/api";

interface CartLine {
  id: string;
  productName: string;
  size: string | null;
  color: string | null;
  imageUrl: string | null;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
}

interface Cart {
  lines: CartLine[];
  itemCount: number;
}

interface Quote {
  items: Array<{
    cartItemId: string;
    name: string;
    size: string | null;
    color: string | null;
    imageUrl: string | null;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
  }>;
  shippingOptions: Array<{ code: string; label: string; description: string; price: string; freeOver: string | null }>;
  subtotal: string;
  discountTotal: string;
  shippingTotal: string;
  taxTotal: string;
  total: string;
  coupon: { code: string; description: string | null; amount: string; valid: boolean } | null;
}

interface Config {
  paymentMethods: Array<{ code: string; label: string; enabled: boolean; simulated: boolean }>;
  returnWindowDays: number;
}

const COUNTRIES = [
  ["US", "United States"],
  ["CA", "Canada"],
  ["GB", "United Kingdom"],
  ["AU", "Australia"],
  ["DE", "Germany"],
  ["FR", "France"],
  ["IT", "Italy"],
  ["ES", "Spain"],
  ["NL", "Netherlands"],
  ["SE", "Sweden"],
];

interface Props {
  user: { email: string; firstName: string; lastName: string; phone: string | null } | null;
}

export function CheckoutView({ user }: Props) {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idempotencyKey = useRef<string>("");

  const [email, setEmail] = useState(user?.email ?? "");
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("US");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("SANDBOX_CARD");
  const [customerNote, setCustomerNote] = useState("");
  const [saveAddress, setSaveAddress] = useState(false);

  useEffect(() => {
    idempotencyKey.current = crypto.randomUUID();
    const load = async () => {
      try {
        const [cartData, configData] = await Promise.all([
          clientApi<Cart>("/cart"),
          clientApi<Config>("/checkout/config"),
        ]);
        if (!cartData.lines.length) {
          router.replace("/cart");
          return;
        }
        setCart(cartData);
        setConfig(configData);
        const cod = configData.paymentMethods.find((method) => method.code === "CASH_ON_DELIVERY");
        if (!cod?.enabled) setPaymentMethod("SANDBOX_CARD");
        const quoteData = await clientApi<Quote>("/checkout/quote", {
          method: "POST",
          body: JSON.stringify({ shippingMethod: "standard" }),
        });
        setQuote(quoteData);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load checkout");
      } finally {
        setLoading(false);
      }
    };
    void load();
     
  }, []);

  useEffect(() => {
    if (loading || !cart) return;
    let active = true;
    clientApi<Quote>("/checkout/quote", {
      method: "POST",
      body: JSON.stringify({ shippingMethod }),
    })
      .then((data) => active && setQuote(data))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [shippingMethod, loading, cart]);

  const requiredErrors = useMemo(() => {
    const errors: string[] = [];
    if (!email.includes("@")) errors.push("email");
    if (!firstName.trim()) errors.push("firstName");
    if (!lastName.trim()) errors.push("lastName");
    if (line1.trim().length < 3) errors.push("line1");
    if (!city.trim()) errors.push("city");
    if (postalCode.trim().length < 2) errors.push("postalCode");
    if (country.length !== 2) errors.push("country");
    return errors;
  }, [email, firstName, lastName, line1, city, postalCode, country]);

  const placeOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    if (requiredErrors.length) {
      setError("Please complete the required delivery details.");
      return;
    }
    setPlacing(true);
    setError(null);
    try {
      const result = await clientApi<{
        order: { orderNumber: string; status: string; grandTotal: string };
        payment: { reference: string; method: string; amount: string; status: string } | null;
        duplicate: boolean;
      }>("/checkout", {
        method: "POST",
        body: JSON.stringify({
          email,
          shippingAddress: {
            firstName,
            lastName,
            line1,
            line2: line2 || undefined,
            city,
            state: state || undefined,
            postalCode,
            country,
            phone: phone || undefined,
          },
          shippingMethod,
          paymentMethod,
          customerNote: customerNote || undefined,
          idempotencyKey: idempotencyKey.current,
          saveAddress: user ? saveAddress : false,
        }),
      });
      window.dispatchEvent(new Event("cart:updated"));
      sessionStorage.setItem(
        "ds-last-order",
        JSON.stringify({ orderNumber: result.order.orderNumber, email }),
      );
      if (paymentMethod === "CASH_ON_DELIVERY" || !result.payment) {
        router.push(`/checkout/confirmation?order=${encodeURIComponent(result.order.orderNumber)}`);
      } else {
        router.push(
          `/checkout/payment?reference=${encodeURIComponent(result.payment.reference)}&order=${encodeURIComponent(result.order.orderNumber)}&email=${encodeURIComponent(email)}&amount=${encodeURIComponent(result.payment.amount)}`,
        );
      }
    } catch (placeError) {
      setError(placeError instanceof Error ? placeError.message : "Could not place order");
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-10 py-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">{[0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse bg-sand" />)}</div>
        <div className="h-72 animate-pulse bg-sand" />
      </div>
    );
  }

  return (
    <form onSubmit={placeOrder} className="grid gap-10 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
      <div className="space-y-10">
        {error && <div role="alert" className="border border-sale/40 bg-sale/5 p-4 text-sm text-sale">{error}</div>}

        <section>
          <div className="flex items-baseline gap-3 border-b border-line pb-3">
            <span className="font-display text-2xl text-stone">01</span>
            <h2 className="font-display text-2xl">Contact</h2>
          </div>
          <div className="mt-5">
            <label htmlFor="email" className="label">Email address</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="field" autoComplete="email" />
            <p className="mt-2 text-xs text-muted">Order confirmation and tracking updates are sent here.</p>
            {!user && (
              <p className="mt-3 text-xs text-muted">
                Have an account? <Link href="/login?next=/checkout" className="underline">Sign in</Link> for faster checkout.
              </p>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-baseline gap-3 border-b border-line pb-3">
            <span className="font-display text-2xl text-stone">02</span>
            <h2 className="font-display text-2xl">Delivery address</h2>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="label">First name</label>
              <input id="firstName" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="field" autoComplete="given-name" />
            </div>
            <div>
              <label htmlFor="lastName" className="label">Last name</label>
              <input id="lastName" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="field" autoComplete="family-name" />
            </div>
            <div className="col-span-2">
              <label htmlFor="line1" className="label">Address</label>
              <input id="line1" required value={line1} onChange={(e) => setLine1(e.target.value)} className="field" autoComplete="address-line1" placeholder="Street and number" />
            </div>
            <div className="col-span-2">
              <label htmlFor="line2" className="label">Apartment, suite (optional)</label>
              <input id="line2" value={line2} onChange={(e) => setLine2(e.target.value)} className="field" autoComplete="address-line2" />
            </div>
            <div>
              <label htmlFor="city" className="label">City</label>
              <input id="city" required value={city} onChange={(e) => setCity(e.target.value)} className="field" autoComplete="address-level2" />
            </div>
            <div>
              <label htmlFor="state" className="label">State / region</label>
              <input id="state" value={state} onChange={(e) => setState(e.target.value)} className="field" autoComplete="address-level1" />
            </div>
            <div>
              <label htmlFor="postalCode" className="label">Postal code</label>
              <input id="postalCode" required value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="field" autoComplete="postal-code" />
            </div>
            <div>
              <label htmlFor="country" className="label">Country</label>
              <select id="country" value={country} onChange={(e) => setCountry(e.target.value)} className="field" autoComplete="country">
                {COUNTRIES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label htmlFor="phone" className="label">Phone (for delivery updates)</label>
              <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="field" autoComplete="tel" />
            </div>
          </div>
          {user && (
            <label className="mt-4 flex items-center gap-3 text-sm">
              <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="h-4 w-4 accent-[#1a1917]" />
              Save this address to my account
            </label>
          )}
        </section>

        <section>
          <div className="flex items-baseline gap-3 border-b border-line pb-3">
            <span className="font-display text-2xl text-stone">03</span>
            <h2 className="font-display text-2xl">Delivery method</h2>
          </div>
          <div className="mt-5 space-y-3">
            {quote?.shippingOptions.map((option) => (
              <label key={option.code} className={`flex cursor-pointer items-center justify-between gap-4 border p-4 ${shippingMethod === option.code ? "border-ink" : "border-line"}`}>
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shippingMethod"
                    value={option.code}
                    checked={shippingMethod === option.code}
                    onChange={() => setShippingMethod(option.code)}
                    className="h-4 w-4 accent-[#1a1917]"
                  />
                  <span>
                    <span className="block text-sm">{option.label}</span>
                    <span className="block text-xs text-muted">{option.description}</span>
                  </span>
                </span>
                <span className="text-sm">{Number(option.price) === 0 || (option.freeOver && Number(quote.subtotal) >= Number(option.freeOver)) ? "Free" : money(option.price)}</span>
              </label>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-baseline gap-3 border-b border-line pb-3">
            <span className="font-display text-2xl text-stone">04</span>
            <h2 className="font-display text-2xl">Payment</h2>
          </div>
          <div className="mt-5 space-y-3">
            {config?.paymentMethods.filter((method) => method.enabled).map((method) => (
              <label key={method.code} className={`flex cursor-pointer items-start gap-3 border p-4 ${paymentMethod === method.code ? "border-ink" : "border-line"}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.code}
                  checked={paymentMethod === method.code}
                  onChange={() => setPaymentMethod(method.code)}
                  className="mt-1 h-4 w-4 accent-[#1a1917]"
                />
                <span>
                  <span className="block text-sm">{method.label}</span>
                  <span className="block text-xs text-muted">
                    {method.code === "SANDBOX_CARD"
                      ? "Simulated card payment. You'll confirm on the next screen. No real money moves."
                      : "Pay in cash when your order is delivered."}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted">
            <Lock className="h-3.5 w-3.5" /> Sandbox environment — do not enter real card details.
          </div>
        </section>

        <section>
          <label htmlFor="customerNote" className="label">Order note (optional)</label>
          <textarea id="customerNote" value={customerNote} onChange={(e) => setCustomerNote(e.target.value)} rows={3} maxLength={500} className="field resize-y" placeholder="Delivery instructions or a gift note" />
        </section>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="border border-line p-6">
          <p className="overline">Your order</p>
          <ul className="mt-5 space-y-4 border-b border-line pb-5">
            {quote?.items.map((item) => (
              <li key={item.cartItemId} className="flex gap-3">
                <div className="h-20 w-16 shrink-0 overflow-hidden bg-sand">
                  {item.imageUrl && (
                     
                    <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm leading-snug">{item.name}</p>
                  <p className="mt-0.5 text-xs text-muted">{item.color} {item.size && `· ${item.size}`} · Qty {item.quantity}</p>
                </div>
                <p className="text-sm">{money(item.lineTotal)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(quote?.subtotal)}</dd></div>
            {Number(quote?.discountTotal ?? 0) > 0 && (
              <div className="flex justify-between text-sale"><dt>Discount {quote?.coupon?.code && `(${quote.coupon.code})`}</dt><dd>−{money(quote?.discountTotal)}</dd></div>
            )}
            <div className="flex justify-between"><dt>Delivery</dt><dd>{Number(quote?.shippingTotal ?? 0) === 0 ? "Free" : money(quote?.shippingTotal)}</dd></div>
            <div className="flex justify-between"><dt>Tax</dt><dd>{money(quote?.taxTotal)}</dd></div>
            <div className="flex justify-between border-t border-line pt-3 text-base font-medium"><dt>Total</dt><dd>{money(quote?.total)}</dd></div>
          </dl>
          <button type="submit" disabled={placing || !quote || requiredErrors.length > 0} className="btn btn-primary mt-6 w-full">
            {placing ? "Placing order…" : paymentMethod === "CASH_ON_DELIVERY" ? "Place order" : `Continue to payment · ${money(quote?.total)}`}
          </button>
          <p className="mt-3 flex items-center justify-center gap-2 text-[11px] text-muted">
            <Truck className="h-3.5 w-3.5" /> Delivery in 3–5 business days
          </p>
          <Link href="/cart" className="mt-4 block text-center text-xs underline">Return to bag</Link>
        </div>
      </aside>
    </form>
  );
}
