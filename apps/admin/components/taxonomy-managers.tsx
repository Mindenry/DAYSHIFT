"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clientApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n-client";
import { enumLabel } from "@/lib/messages";
import { localized } from "@/lib/localize";
import { Modal, FormActions } from "./modal";

type Category = {
  id: string; name: string; nameEn: string | null; slug: string; description: string | null;
  descriptionEn: string | null; imageUrl: string | null;
  parentId: string | null; position: number; isActive: boolean; _count?: { products: number; children: number };
};

const emptyCategory = {
  name: "", nameEn: "", slug: "", description: "", descriptionEn: "", imageUrl: "", parentId: "", position: "0", isActive: true,
};

const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export function CategoryManager({ initial }: { initial: Category[] }) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ ...emptyCategory });
  const [busy, setBusy] = useState(false);

  const start = (category?: Category) => {
    setEditing(category ?? null);
    setForm(category ? {
      name: category.name, nameEn: category.nameEn ?? "", slug: category.slug,
      description: category.description ?? "", descriptionEn: category.descriptionEn ?? "",
      imageUrl: category.imageUrl ?? "", parentId: category.parentId ?? "",
      position: String(category.position), isActive: category.isActive,
    } : { ...emptyCategory });
    setOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = {
        name: form.name,
        nameEn: form.nameEn || form.name,
        slug: form.slug || slugify(form.name),
        description: form.description || undefined,
        descriptionEn: form.descriptionEn || undefined,
        imageUrl: form.imageUrl || undefined,
        parentId: form.parentId || null,
        position: Number(form.position || 0),
        isActive: form.isActive,
      };
      if (editing) await clientApi(`/admin/catalog/categories/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await clientApi("/admin/catalog/categories", { method: "POST", body: JSON.stringify(payload) });
      toast(editing ? t("Category updated") : t("Category created"));
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Could not save category"));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (category: Category) => {
    if (!window.confirm(t("Delete {name}? Products and child categories must be moved first.", { name: category.name }))) return;
    try {
      await clientApi(`/admin/catalog/categories/${category.id}`, { method: "DELETE" });
      toast(t("Category deleted"));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Could not delete category"));
    }
  };

  return (
    <>
      <div className="mb-3 flex justify-end"><button type="button" className="a-btn" onClick={() => start()}>{t("New category")}</button></div>
      <div className="panel overflow-hidden">
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t("Name")}</th><th>{t("Slug")}</th><th>{t("Parent")}</th><th>{t("Products")}</th><th>{t("Status")}</th><th>{t("Position")}</th><th /></tr></thead>
            <tbody>
              {initial.map((category) => (
                <tr key={category.id}>
                  <td className="font-medium">{category.parentId ? <span className="text-muted">— </span> : null}{localized(locale, category.name, category.nameEn)}</td>
                  <td className="font-mono text-[11px] text-muted">{category.slug}</td>
                  <td className="text-[11px] text-muted">{(() => { const parent = initial.find((c) => c.id === category.parentId); return parent ? localized(locale, parent.name, parent.nameEn) : "—"; })()}</td>
                  <td className="mono">{category._count?.products ?? 0}</td>
                  <td><span className={`text-[10px] font-semibold uppercase tracking-[0.06em] ${category.isActive ? "text-accent" : "text-muted"}`}>{category.isActive ? t("Active") : t("Hidden")}</span></td>
                  <td className="mono">{category.position}</td>
                  <td className="text-right">
                    <button type="button" className="a-link" onClick={() => start(category)}>{t("Edit")}</button>
                    <button type="button" className="ml-3 a-link a-link-danger" onClick={() => remove(category)}>{t("Delete")}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <Modal title={editing ? "Edit category" : "New category"} onClose={() => setOpen(false)}>
          <form onSubmit={save}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label" htmlFor="c-name">{t("Name")}</label>
                <input id="c-name" className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: editing ? form.slug : slugify(e.target.value) })} required />
              </div>
              <div>
                <label className="label" htmlFor="c-slug">{t("Slug")}</label>
                <input id="c-slug" className="field font-mono text-xs" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
              </div>
              <div>
                <label className="label" htmlFor="c-parent">{t("Parent")}</label>
                <select id="c-parent" className="field" value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
                  <option value="">{t("Top level")}</option>
                  {initial.filter((c) => c.id !== editing?.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="c-desc">{t("Description")}</label>
                <textarea id="c-desc" rows={3} className="field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="c-descEn">{t("Description (English)")}</label>
                <textarea id="c-descEn" rows={2} className="field" value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="c-image">{t("Image URL")}</label>
                <input id="c-image" className="field" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="/images/products/knit-oat.jpg" />
              </div>
              <div>
                <label className="label" htmlFor="c-pos">{t("Position")}</label>
                <input id="c-pos" type="number" className="field" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
              </div>
              <label className="flex items-end gap-2 pb-2 text-xs">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 accent-[#2f6b4f]" />
                {t("Active")}
              </label>
            </div>
            <FormActions busy={busy} onCancel={() => setOpen(false)} submitLabel="Save" />
          </form>
        </Modal>
      )}
    </>
  );
}

type Collection = {
  id: string; name: string; nameEn: string | null; slug: string; description: string | null;
  descriptionEn: string | null; imageUrl: string | null;
  type: string; position: number; isActive: boolean; startsAt: string | null; endsAt: string | null;
  _count?: { products: number };
};

const emptyCollection = { name: "", nameEn: "", slug: "", description: "", descriptionEn: "", imageUrl: "", type: "EDITORIAL", position: "0", isActive: true, startsAt: "", endsAt: "" };

export function CollectionManager({ initial }: { initial: Collection[] }) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [form, setForm] = useState({ ...emptyCollection });
  const [busy, setBusy] = useState(false);

  const start = (collection?: Collection) => {
    setEditing(collection ?? null);
    setForm(collection ? {
      name: collection.name, nameEn: collection.nameEn ?? "", slug: collection.slug,
      description: collection.description ?? "", descriptionEn: collection.descriptionEn ?? "",
      imageUrl: collection.imageUrl ?? "", type: collection.type, position: String(collection.position),
      isActive: collection.isActive, startsAt: collection.startsAt?.slice(0, 10) ?? "", endsAt: collection.endsAt?.slice(0, 10) ?? "",
    } : { ...emptyCollection });
    setOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = {
        name: form.name, nameEn: form.nameEn || form.name, slug: form.slug || slugify(form.name),
        description: form.description || undefined, descriptionEn: form.descriptionEn || undefined,
        imageUrl: form.imageUrl || undefined, type: form.type, position: Number(form.position || 0),
        isActive: form.isActive, startsAt: form.startsAt || undefined, endsAt: form.endsAt || undefined,
      };
      if (editing) await clientApi(`/admin/catalog/collections/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await clientApi("/admin/catalog/collections", { method: "POST", body: JSON.stringify(payload) });
      toast(editing ? t("Collection updated") : t("Collection created"));
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Could not save collection"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="mb-3 flex justify-end"><button type="button" className="a-btn" onClick={() => start()}>{t("New collection")}</button></div>
      <div className="panel overflow-hidden">
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t("Name")}</th><th>{t("Slug")}</th><th>{t("Type")}</th><th>{t("Products")}</th><th>{t("Window")}</th><th>{t("Status")}</th><th /></tr></thead>
            <tbody>
              {initial.map((collection) => (
                <tr key={collection.id}>
                  <td className="font-medium">{localized(locale, collection.name, collection.nameEn)}</td>
                  <td className="font-mono text-[11px] text-muted">{collection.slug}</td>
                  <td className="text-[11px]">{enumLabel(locale, collection.type)}</td>
                  <td className="mono">{collection._count?.products ?? 0}</td>
                  <td className="text-[10px] text-muted">
                    {collection.startsAt ? new Date(collection.startsAt).toLocaleDateString() : "—"} → {collection.endsAt ? new Date(collection.endsAt).toLocaleDateString() : t("Open")}
                  </td>
                  <td><span className={`text-[10px] font-semibold uppercase ${collection.isActive ? "text-accent" : "text-muted"}`}>{collection.isActive ? t("Active") : t("Hidden")}</span></td>
                  <td className="text-right"><button type="button" className="a-link" onClick={() => start(collection)}>{t("Edit")}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <Modal title={editing ? "Edit collection" : "New collection"} onClose={() => setOpen(false)}>
          <form onSubmit={save}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label" htmlFor="col-name">{t("Name")}</label>
                <input id="col-name" className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: editing ? form.slug : slugify(e.target.value) })} required />
              </div>
              <div>
                <label className="label" htmlFor="col-nameEn">{t("Name (English)")}</label>
                <input id="col-nameEn" className="field" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} placeholder={form.name} />
              </div>
              <div>
                <label className="label" htmlFor="col-slug">{t("Slug")}</label>
                <input id="col-slug" className="field font-mono text-xs" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
              </div>
              <div>
                <label className="label" htmlFor="col-type">{t("Type")}</label>
                <select id="col-type" className="field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {["EDITORIAL", "NEW_ARRIVALS", "BEST_SELLERS", "SALE", "SEASONAL", "LIMITED"].map((value) => <option key={value} value={value}>{enumLabel(locale, value)}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="col-desc">{t("Description")}</label>
                <textarea id="col-desc" rows={2} className="field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="col-descEn">{t("Description (English)")}</label>
                <textarea id="col-descEn" rows={2} className="field" value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="col-image">{t("Image URL")}</label>
                <input id="col-image" className="field" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="col-start">{t("Starts")}</label>
                <input id="col-start" type="date" className="field" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="col-end">{t("Ends")}</label>
                <input id="col-end" type="date" className="field" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="col-pos">{t("Position")}</label>
                <input id="col-pos" type="number" className="field" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
              </div>
              <label className="flex items-end gap-2 pb-2 text-xs">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 accent-[#2f6b4f]" />
                {t("Active")}
              </label>
            </div>
            <FormActions busy={busy} onCancel={() => setOpen(false)} submitLabel="Save" />
          </form>
        </Modal>
      )}
    </>
  );
}

type Brand = { id: string; name: string; slug: string; description: string | null; descriptionEn: string | null; isActive: boolean; _count?: { products: number } };

export function BrandManager({ initial }: { initial: Brand[] }) {
  const router = useRouter();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "", descriptionEn: "", isActive: true });
  const [busy, setBusy] = useState(false);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = { name: form.name, slug: form.slug || slugify(form.name), description: form.description || undefined, descriptionEn: form.descriptionEn || undefined, isActive: form.isActive };
      if (editing) await clientApi(`/admin/catalog/brands/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await clientApi("/admin/catalog/brands", { method: "POST", body: JSON.stringify(payload) });
      toast(editing ? t("Brand updated") : t("Brand created"));
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Could not save brand"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="mb-3 flex justify-end">
        <button type="button" className="a-btn" onClick={() => { setEditing(null); setForm({ name: "", slug: "", description: "", descriptionEn: "", isActive: true }); setOpen(true); }}>{t("New brand")}</button>
      </div>
      <div className="panel overflow-hidden">
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t("Name")}</th><th>{t("Slug")}</th><th>{t("Products")}</th><th>{t("Status")}</th><th /></tr></thead>
            <tbody>
              {initial.map((brand) => (
                <tr key={brand.id}>
                  <td className="font-medium">{brand.name}</td>
                  <td className="font-mono text-[11px] text-muted">{brand.slug}</td>
                  <td className="mono">{brand._count?.products ?? 0}</td>
                  <td><span className={`text-[10px] font-semibold uppercase ${brand.isActive ? "text-accent" : "text-muted"}`}>{brand.isActive ? t("Active") : t("Hidden")}</span></td>
                  <td className="text-right">
                    <button type="button" className="a-link" onClick={() => {
                      setEditing(brand); setForm({ name: brand.name, slug: brand.slug, description: brand.description ?? "", descriptionEn: brand.descriptionEn ?? "", isActive: brand.isActive }); setOpen(true);
                    }}>{t("Edit")}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {open && (
        <Modal title={editing ? "Edit brand" : "New brand"} onClose={() => setOpen(false)}>
          <form onSubmit={save}>
            <div className="space-y-4">
              <div><label className="label" htmlFor="b-name">{t("Name")}</label><input id="b-name" className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: editing ? form.slug : slugify(e.target.value) })} required /></div>
              <div><label className="label" htmlFor="b-slug">{t("Slug")}</label><input id="b-slug" className="field font-mono text-xs" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required /></div>
              <div><label className="label" htmlFor="b-desc">{t("Description")}</label><textarea id="b-desc" rows={3} className="field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><label className="label" htmlFor="b-descEn">{t("Description (English)")}</label><textarea id="b-descEn" rows={2} className="field" value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 accent-[#2f6b4f]" /> {t("Active")}</label>
            </div>
            <FormActions busy={busy} onCancel={() => setOpen(false)} submitLabel="Save" />
          </form>
        </Modal>
      )}
    </>
  );
}
