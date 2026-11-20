import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { getCookieHeader } from "@/lib/session";
import { ReturnForm } from "@/components/return-form";
import type { ProductDetailDto } from "@dayshift/types";

export const metadata: Metadata = { title: "Start a return — DAYSHIFT", robots: { index: false } };

interface OrderForReturn {
  id: string;
  orderNumber: string;
  canReturn: boolean;
  returnWindowEndsAt: string | null;
  items: Array<{
    id: string;
    variantId: string | null;
    productSlug: string;
    productName: string;
    size: string | null;
    color: string | null;
    imageUrl: string | null;
    quantity: number;
    unitPrice: string;
    discountAllocated: string;
    refundedQuantity: number;
    returnedQuantity: number;
  }>;
  returnableItems: Array<{
    id: string;
    productName: string;
    size: string | null;
    color: string | null;
    imageUrl: string | null;
    quantity: number;
    returnableQuantity: number;
    unitPrice: string;
    discountAllocated: string;
  }>;
}

export default async function ReturnRequestPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const cookie = await getCookieHeader();
  const order = await apiGet<OrderForReturn>(`/orders/${orderNumber}`, { cookie, revalidate: 0 });
  if (!order) notFound();

  if (!order.canReturn) {
    return (
      <div>
        <p className="overline text-muted">Returns</p>
        <h1 className="mt-2 font-display text-4xl">This order isn&apos;t eligible for a return.</h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
          Returns are accepted within 30 days of delivery for unworn pieces with tags attached.
          If you think this is a mistake, please contact customer care.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href={`/account/orders/${orderNumber}`} className="btn btn-outline">Back to order</Link>
          <Link href="/account/support" className="btn btn-primary">Contact care</Link>
        </div>
      </div>
    );
  }

  const items = order.returnableItems.map((item) => {
    const original = order.items.find((entry) => entry.id === item.id);
    return {
      orderItemId: item.id,
      productSlug: original?.productSlug ?? "",
      variantId: original?.variantId ?? null,
      productName: item.productName,
      size: item.size,
      color: item.color,
      imageUrl: item.imageUrl,
      returnableQuantity: item.returnableQuantity,
      unitPrice: item.unitPrice,
      discountAllocated: item.discountAllocated,
      exchangeVariants: [] as Array<{ id: string; size: string | null; color: string | null; availableStock: number }>,
    };
  });

  const slugs = Array.from(new Set(items.map((item) => item.productSlug).filter(Boolean)));
  const products = await Promise.all(
    slugs.map((slug) => apiGet<ProductDetailDto>(`/products/${slug}`, { revalidate: 60 })),
  );
  const productBySlug = new Map(products.filter(Boolean).map((product) => [product!.slug, product!]));
  for (const item of items) {
    const product = productBySlug.get(item.productSlug);
    if (!product) continue;
    item.exchangeVariants = product.variants
      .filter((variant) => variant.inStock && variant.id !== item.variantId)
      .map((variant) => ({
        id: variant.id,
        size: variant.size,
        color: variant.color,
        availableStock: variant.availableStock,
      }));
  }

  return (
    <div>
      <Link href={`/account/orders/${order.orderNumber}`} className="overline link-underline text-muted">Back to order</Link>
      <div className="mt-3 border-b border-line pb-6">
        <p className="overline text-muted">Order {order.orderNumber}</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">Start a return</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Choose the pieces you&apos;d like to return or exchange. Once we receive and inspect them,
          we&apos;ll process your refund or ship the replacement.
          {order.returnWindowEndsAt && (
            <> Your return window closes on {new Date(order.returnWindowEndsAt).toLocaleDateString("en-US", { month: "long", day: "numeric" })}.</>
          )}
        </p>
      </div>
      <ReturnForm orderId={order.id} orderNumber={order.orderNumber} items={items} />
    </div>
  );
}
