import Link from "next/link";
import { PageHeader, Badge, Pagination, EmptyState } from "@/components/ui";
import { apiGet, money, date } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";

interface ProductsResponse {
  items: Array<{
    id: string; name: string; slug: string; sku: string; status: string; price: string;
    compareAtPrice: string | null; image: string | null; variantCount: number; stock: number;
    categories: string[]; updatedAt: string;
  }>;
  meta: { page: number; total: number; totalPages: number };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireStaff();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const status = typeof params.status === "string" ? params.status : "";
  const page = typeof params.page === "string" ? params.page : "1";
  const cookie = await getCookieHeader();
  const query = new URLSearchParams({ page, pageSize: "30" });
  if (q) query.set("q", q);
  if (status) query.set("status", status);
  const products = await apiGet<ProductsResponse>(`/admin/catalog/products?${query.toString()}`, { cookie });

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description={`${products?.meta.total ?? 0} products across the catalogue. Manage pricing, media, variants and publication.`}
        actions={session?.permissions.includes("products.create") ? <Link href="/products/new" className="a-btn">New product</Link> : null}
      />
      <div className="panel">
        <form method="get" className="flex flex-wrap items-end gap-2 border-b border-line p-3">
          <div className="min-w-56 flex-1">
            <label htmlFor="q" className="label">Search</label>
            <input id="q" name="q" defaultValue={q} placeholder="Name or SKU" className="field" />
          </div>
          <div>
            <label htmlFor="status" className="label">Status</label>
            <select id="status" name="status" defaultValue={status} className="field">
              <option value="">All</option>
              {["ACTIVE", "DRAFT", "ARCHIVED", "DISCONTINUED"].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
          <button type="submit" className="a-btn a-btn-outline">Filter</button>
          {(q || status) && <Link href="/products" className="a-btn a-btn-outline">Reset</Link>}
        </form>

        {!products?.items.length ? (
          <EmptyState title="No products found" body="Try another search, or create a product." action={<Link href="/products/new" className="a-btn">New product</Link>} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table>
                <thead><tr><th>Product</th><th>Status</th><th>Categories</th><th>Variants</th><th>Stock</th><th className="text-right">Price</th><th>Updated</th><th /></tr></thead>
                <tbody>
                  {products.items.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-10 shrink-0 overflow-hidden border border-line bg-white">
                            {product.image && (
                               
                              <img src={product.image} alt="" className="h-full w-full object-cover" />
                            )}
                          </div>
                          <div>
                            <Link href={`/products/${product.id}`} className="font-medium hover:underline">{product.name}</Link>
                            <p className="mt-0.5 font-mono text-[10px] text-muted">{product.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td><Badge status={product.status} /></td>
                      <td className="text-[11px] text-muted">{product.categories.join(", ") || "—"}</td>
                      <td>{product.variantCount}</td>
                      <td className={product.stock <= 0 ? "text-danger" : product.stock < 10 ? "text-warn" : ""}>{product.stock}</td>
                      <td className="text-right">{money(product.price)}</td>
                      <td className="text-[11px] text-muted">{date(product.updatedAt)}</td>
                      <td className="text-right"><Link href={`/products/${product.id}`} className="text-[11px] underline">Edit</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={products.meta.page} totalPages={products.meta.totalPages} basePath="/products" params={{ q, status }} />
          </>
        )}
      </div>
    </div>
  );
}
