"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clientApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n-client";

interface Category { id: string; name: string; slug: string; parentId: string | null }
interface Collection { id: string; name: string; slug: string }
interface Brand { id: string; name: string; slug: string }

interface VariantRow {
  sku: string;
  size: string;
  color: string;
  colorHex: string;
  priceOverride: string;
  initialStock: string;
}

interface ImageRow { url: string; alt: string; color: string }

interface ProductData {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string | null;
  description: string;
  brandId: string | null;
  status: string;
  visibility: string;
  price: string;
  compareAtPrice: string | null;
  costPrice: string | null;
  material: string | null;
  careInstructions: string | null;
  fitNotes: string | null;
  features: string[];
  tags: string[];
  metaTitle: string | null;
  metaDescription: string | null;
  isFeatured: boolean;
  images: Array<{ id: string; url: string; alt: string; color: string | null }>;
  categories: Array<{ categoryId: string }>;
  collections: Array<{ collectionId: string }>;
}

const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export function ProductForm({
  mode,
  product,
  categories,
  collections,
  brands,
}: {
  mode: "create" | "edit";
  product?: ProductData;
  categories: Category[];
  collections: Collection[];
  brands: Brand[];
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [shortDescription, setShortDescription] = useState(product?.shortDescription ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [brandId, setBrandId] = useState(product?.brandId ?? "");
  const [status, setStatus] = useState(product?.status ?? "DRAFT");
  const [visibility, setVisibility] = useState(product?.visibility ?? "PUBLIC");
  const [price, setPrice] = useState(product?.price ?? "");
  const [compareAtPrice, setCompareAtPrice] = useState(product?.compareAtPrice ?? "");
  const [costPrice, setCostPrice] = useState(product?.costPrice ?? "");
  const [material, setMaterial] = useState(product?.material ?? "");
  const [care, setCare] = useState(product?.careInstructions ?? "");
  const [fitNotes, setFitNotes] = useState(product?.fitNotes ?? "");
  const [features, setFeatures] = useState((product?.features ?? []).join("\n"));
  const [tags, setTags] = useState((product?.tags ?? []).join(", "));
  const [metaTitle, setMetaTitle] = useState(product?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(product?.metaDescription ?? "");
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [categoryIds, setCategoryIds] = useState<string[]>(product?.categories.map((c) => c.categoryId) ?? []);
  const [collectionIds, setCollectionIds] = useState<string[]>(product?.collections.map((c) => c.collectionId) ?? []);
  const [images, setImages] = useState<ImageRow[]>(
    product?.images.map((image) => ({ url: image.url, alt: image.alt, color: image.color ?? "" })) ?? [
      { url: "", alt: "", color: "" },
    ],
  );
  const [variants, setVariants] = useState<VariantRow[]>([
    { sku: "", size: "", color: "", colorHex: "#1A1917", priceOverride: "", initialStock: "0" },
  ]);
  const [sizesInput, setSizesInput] = useState("");
  const [colorsInput, setColorsInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateVariants = () => {
    const sizes = sizesInput.split(",").map((s) => s.trim()).filter(Boolean);
    const colors = colorsInput.split(",").map((c) => c.trim()).filter(Boolean);
    if (!sizes.length || !colors.length) {
      toast.error(t("Enter sizes and colours first"));
      return;
    }
    const rows: VariantRow[] = [];
    for (const color of colors) {
      for (const size of sizes) {
        rows.push({
          sku: `${sku || "DS"}-${color.slice(0, 3).toUpperCase().replace(/\s/g, "")}-${size}`.toUpperCase(),
          size,
          color,
          colorHex: "#1A1917",
          priceOverride: "",
          initialStock: "0",
        });
      }
    }
    setVariants(rows);
  };

  const toggle = (list: string[], setList: (value: string[]) => void, id: string) => {
    setList(list.includes(id) ? list.filter((entry) => entry !== id) : [...list, id]);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      name,
      slug: slug || slugify(name),
      sku,
      shortDescription: shortDescription || undefined,
      description,
      brandId: brandId || undefined,
      status,
      visibility,
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      costPrice: costPrice ? Number(costPrice) : undefined,
      material: material || undefined,
      careInstructions: care || undefined,
      fitNotes: fitNotes || undefined,
      features: features.split("\n").map((f) => f.trim()).filter(Boolean),
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      isFeatured,
      categoryIds,
      collectionIds,
      images: images.filter((image) => image.url.trim()).map((image) => ({
        url: image.url.trim(),
        alt: image.alt.trim() || name,
        color: image.color.trim() || undefined,
      })),
      ...(mode === "create"
        ? {
            variants: variants
              .filter((variant) => variant.sku.trim())
              .map((variant) => ({
                sku: variant.sku.trim(),
                size: variant.size.trim() || "One Size",
                color: variant.color.trim() || undefined,
                colorHex: variant.colorHex || undefined,
                priceOverride: variant.priceOverride ? Number(variant.priceOverride) : undefined,
                initialStock: Number(variant.initialStock || 0),
              })),
          }
        : {}),
    };

    if (!categoryIds.length) {
      setError(t("Choose at least one category."));
      setBusy(false);
      return;
    }
    if (mode === "create" && !payload.variants?.length) {
      setError(t("Add at least one variant with a SKU."));
      setBusy(false);
      return;
    }

    try {
      const result = await clientApi<{ id: string }>(
        mode === "create" ? "/admin/catalog/products" : `/admin/catalog/products/${product!.id}`,
        { method: mode === "create" ? "POST" : "PATCH", body: JSON.stringify(payload) },
      );
      toast(mode === "create" ? t("Product created") : t("Product updated"));
      router.push(mode === "create" ? `/products/${result.id}` : "/products");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("Could not save product"));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
      {error && <div className="border border-danger/30 bg-danger-soft p-3 text-xs text-danger xl:col-span-2">{error}</div>}

      <div className="space-y-4">
        <section className="panel p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("Product details")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="name">{t("Name")}</label>
              <input id="name" className="field" value={name} onChange={(e) => { setName(e.target.value); if (!product) setSlug(slugify(e.target.value)); }} required maxLength={160} />
            </div>
            <div>
              <label className="label" htmlFor="slug">{t("URL slug")}</label>
              <input id="slug" className="field" value={slug} onChange={(e) => setSlug(e.target.value)} required pattern="[a-z0-9-]+" />
            </div>
            <div>
              <label className="label" htmlFor="sku">{t("Base SKU")}</label>
              <input id="sku" className="field font-mono text-xs" value={sku} onChange={(e) => setSku(e.target.value.toUpperCase())} required />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="short">{t("Short description")}</label>
              <input id="short" className="field" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} maxLength={300} />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="description">{t("Description")}</label>
              <textarea id="description" rows={6} className="field" value={description} onChange={(e) => setDescription(e.target.value)} required minLength={20} />
            </div>
            <div>
              <label className="label" htmlFor="status">{t("Status")}</label>
              <select id="status" className="field" value={status} onChange={(e) => setStatus(e.target.value)}>
                {["DRAFT", "ACTIVE", "ARCHIVED", "DISCONTINUED"].map((value) => <option key={value} value={value}>{t(value.charAt(0) + value.slice(1).toLowerCase())}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="visibility">{t("Visibility")}</label>
              <select id="visibility" className="field" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                <option value="PUBLIC">{t("Public")}</option>
                <option value="HIDDEN">{t("Hidden")}</option>
              </select>
            </div>
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("Pricing")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="price">{t("Price (USD)")}</label>
              <input id="price" type="number" min="0" step="0.01" className="field" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </div>
            <div>
              <label className="label" htmlFor="compare">{t("Compare at")}</label>
              <input id="compare" type="number" min="0" step="0.01" className="field" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="cost">{t("Cost price")}</label>
              <input id="cost" type="number" min="0" step="0.01" className="field" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
            </div>
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("Materials & content")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="material">{t("Materials")}</label>
              <input id="material" className="field" value={material} onChange={(e) => setMaterial(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="fit">{t("Fit notes")}</label>
              <input id="fit" className="field" value={fitNotes} onChange={(e) => setFitNotes(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="care">{t("Care instructions")}</label>
              <input id="care" className="field" value={care} onChange={(e) => setCare(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="features">{t("Features (one per line)")}</label>
              <textarea id="features" rows={4} className="field" value={features} onChange={(e) => setFeatures(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="tags">{t("Tags (comma separated)")}</label>
              <textarea id="tags" rows={4} className="field" value={tags} onChange={(e) => setTags(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="metaTitle">{t("SEO title")}</label>
              <input id="metaTitle" className="field" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} maxLength={160} />
            </div>
            <div>
              <label className="label" htmlFor="metaDesc">{t("SEO description")}</label>
              <input id="metaDesc" className="field" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} maxLength={320} />
            </div>
          </div>
        </section>

        {mode === "create" && (
          <section className="panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("Variants")}</h2>
              <span className="text-[10px] text-muted">{t("{count} rows", { count: variants.length })}</span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <input className="field" placeholder={t("Sizes: XS, S, M, L")} value={sizesInput} onChange={(e) => setSizesInput(e.target.value)} />
              <input className="field" placeholder={t("Colours: Black, Oat")} value={colorsInput} onChange={(e) => setColorsInput(e.target.value)} />
              <button type="button" onClick={generateVariants} className="a-btn a-btn-outline">{t("Generate")}</button>
            </div>
            <div className="table-wrap mt-4">
              <table>
                <thead><tr><th>{t("SKU")}</th><th>{t("Size")}</th><th>{t("Colour")}</th><th>{t("Hex")}</th><th>{t("Price override")}</th><th>{t("Stock")}</th><th /></tr></thead>
                <tbody>
                  {variants.map((variant, index) => (
                    <tr key={index}>
                      <td><input className="field !min-h-0 !py-1 font-mono text-[11px]" value={variant.sku} onChange={(e) => setVariants(variants.map((row, i) => i === index ? { ...row, sku: e.target.value.toUpperCase() } : row))} /></td>
                      <td><input className="field !min-h-0 !py-1" value={variant.size} onChange={(e) => setVariants(variants.map((row, i) => i === index ? { ...row, size: e.target.value } : row))} /></td>
                      <td><input className="field !min-h-0 !py-1" value={variant.color} onChange={(e) => setVariants(variants.map((row, i) => i === index ? { ...row, color: e.target.value } : row))} /></td>
                      <td><input type="color" className="h-8 w-10 rounded border border-line bg-white" value={variant.colorHex} onChange={(e) => setVariants(variants.map((row, i) => i === index ? { ...row, colorHex: e.target.value } : row))} /></td>
                      <td><input type="number" step="0.01" className="field !min-h-0 !py-1" value={variant.priceOverride} onChange={(e) => setVariants(variants.map((row, i) => i === index ? { ...row, priceOverride: e.target.value } : row))} /></td>
                      <td><input type="number" className="field !min-h-0 !py-1" value={variant.initialStock} onChange={(e) => setVariants(variants.map((row, i) => i === index ? { ...row, initialStock: e.target.value } : row))} /></td>
                      <td><button type="button" className="a-link a-link-danger" onClick={() => setVariants(variants.filter((_, i) => i !== index))}>{t("Remove")}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" className="a-btn a-btn-outline a-btn-sm mt-3" onClick={() => setVariants([...variants, { sku: "", size: "", color: "", colorHex: "#1A1917", priceOverride: "", initialStock: "0" }])}>{t("Add row")}</button>
          </section>
        )}

        <section className="panel p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("Images")}</h2>
            <button type="button" className="a-btn a-btn-outline a-btn-sm" onClick={() => setImages([...images, { url: "", alt: "", color: "" }])}>{t("Add image")}</button>
          </div>
          <div className="mt-3 space-y-2">
            {images.map((image, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-[1.6fr_1.2fr_0.8fr_auto]">
                <input className="field" placeholder="/images/products/tee-black.jpg or https://…" value={image.url} onChange={(e) => setImages(images.map((row, i) => i === index ? { ...row, url: e.target.value } : row))} />
                <input className="field" placeholder={t("Alt text")} value={image.alt} onChange={(e) => setImages(images.map((row, i) => i === index ? { ...row, alt: e.target.value } : row))} />
                <input className="field" placeholder={t("Colour")} value={image.color} onChange={(e) => setImages(images.map((row, i) => i === index ? { ...row, color: e.target.value } : row))} />
                <button type="button" className="a-link a-link-danger" onClick={() => setImages(images.filter((_, i) => i !== index))}>{t("Remove")}</button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
        <section className="panel p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("Organisation")}</h2>
          <div className="mt-4">
            <label className="label" htmlFor="brand">{t("Brand")}</label>
            <select id="brand" className="field" value={brandId} onChange={(e) => setBrandId(e.target.value)}>
              <option value="">{t("No brand")}</option>
              {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
            </select>
          </div>
          <label className="mt-4 flex items-center gap-2 text-xs">
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="h-4 w-4 accent-[#2f6b4f]" />
            {t("Feature on the storefront")}
          </label>
          <fieldset className="mt-4">
            <legend className="label">{t("Categories")}</legend>
            <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border border-line bg-white p-2">
              {categories.map((category) => (
                <label key={category.id} className="flex items-center gap-2 py-0.5 text-xs">
                  <input type="checkbox" checked={categoryIds.includes(category.id)} onChange={() => toggle(categoryIds, setCategoryIds, category.id)} className="h-3.5 w-3.5 accent-[#2f6b4f]" />
                  {category.parentId ? "— " : ""}{category.name}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-4">
            <legend className="label">{t("Collections")}</legend>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-line bg-white p-2">
              {collections.map((collection) => (
                <label key={collection.id} className="flex items-center gap-2 py-0.5 text-xs">
                  <input type="checkbox" checked={collectionIds.includes(collection.id)} onChange={() => toggle(collectionIds, setCollectionIds, collection.id)} className="h-3.5 w-3.5 accent-[#2f6b4f]" />
                  {collection.name}
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        <section className="panel p-5">
          <button type="submit" disabled={busy} className="a-btn w-full">
            {busy ? t("Saving…") : mode === "create" ? t("Create product") : t("Save changes")}
          </button>
          <p className="mt-3 text-[10px] leading-relaxed text-muted">
            {t("Saving validates prices and variant uniqueness on the server. Inventory movements are recorded for any initial stock.")}
          </p>
        </section>
      </aside>
    </form>
  );
}
