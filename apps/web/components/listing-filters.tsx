"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { Facets } from "./listing-view";

interface Props {
  facets: Facets;
  basePath: string;
  params: Record<string, string | string[] | undefined>;
  activeSort: string;
  sortOptions: Array<{ value: string; label: string }>;
}

function hiddenFields(params: Record<string, string | string[] | undefined>, exclude: string[]) {
  return Object.entries(params)
    .filter(([key, value]) => !exclude.includes(key) && typeof value === "string" && value)
    .map(([key, value]) => <input key={key} type="hidden" name={key} value={value as string} />);
}

export function ListingFilters({ facets, basePath, params, activeSort, sortOptions }: Props) {
  const [open, setOpen] = useState(false);
  const activeSize = typeof params.size === "string" ? params.size : "";
  const activeColor = typeof params.color === "string" ? params.color : "";
  const activeMin = typeof params.minPrice === "string" ? params.minPrice : "";
  const activeMax = typeof params.maxPrice === "string" ? params.maxPrice : "";
  const activeStock = params.inStock === "true";

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const panel = (
    <form method="get" action={basePath} className="space-y-8" onSubmit={() => setOpen(false)}>
      {hiddenFields(params, ["size", "color", "minPrice", "maxPrice", "inStock", "sort", "page"])}
      <div>
        <p className="overline mb-3">Sort</p>
        <select name="sort" defaultValue={activeSort} className="field !min-h-0 py-2 text-xs uppercase tracking-[0.08em] lg:hidden">
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="overline mb-3">Size</legend>
        <div className="flex flex-wrap gap-2">
          {facets.sizes.map((size) => (
            <label key={size.name} className="cursor-pointer">
              <input
                type="radio"
                name="size"
                value={size.name}
                defaultChecked={activeSize === size.name}
                className="peer sr-only"
              />
              <span className="inline-flex min-w-10 justify-center border border-line px-2.5 py-2 text-[11px] uppercase tracking-[0.08em] transition-colors peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper hover:border-ink">
                {size.name}
              </span>
            </label>
          ))}
          {activeSize && (
            <label className="cursor-pointer">
              <input type="radio" name="size" value="" defaultChecked={false} className="peer sr-only" />
              <span className="inline-flex items-center border border-dashed border-line px-2.5 py-2 text-[11px] text-muted peer-checked:border-ink">
                Any
              </span>
            </label>
          )}
        </div>
      </fieldset>

      <fieldset>
        <legend className="overline mb-3">Colour</legend>
        <div className="flex flex-wrap gap-2">
          {facets.colors.map((color) => (
            <label key={color.name} className="cursor-pointer">
              <input
                type="radio"
                name="color"
                value={color.name}
                defaultChecked={activeColor.toLowerCase() === color.name.toLowerCase()}
                className="peer sr-only"
              />
              <span className="flex items-center gap-2 border border-line px-2.5 py-2 text-[11px] transition-colors peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper hover:border-ink">
                <span
                  className="h-3 w-3 rounded-full border border-ink/20"
                  style={{ backgroundColor: color.hex ?? "#d8d0c1" }}
                />
                {color.name}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="overline mb-3">Price</legend>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="minPrice">Minimum price</label>
          <input
            id="minPrice"
            name="minPrice"
            type="number"
            min={0}
            placeholder={String(Math.floor(facets.price.min))}
            defaultValue={activeMin}
            className="field !min-h-0 w-full px-3 py-2 text-sm"
          />
          <span className="text-muted">–</span>
          <label className="sr-only" htmlFor="maxPrice">Maximum price</label>
          <input
            id="maxPrice"
            name="maxPrice"
            type="number"
            min={0}
            placeholder={String(Math.ceil(facets.price.max))}
            defaultValue={activeMax}
            className="field !min-h-0 w-full px-3 py-2 text-sm"
          />
        </div>
      </fieldset>

      <label className="flex cursor-pointer items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="inStock"
          value="true"
          defaultChecked={activeStock}
          className="h-4 w-4 accent-[#1a1917]"
        />
        In stock only
      </label>

      <div className="flex gap-2 pt-2">
        <button type="submit" className="btn btn-primary flex-1 !min-h-11 !px-4">Apply</button>
        <a href={basePath} className="btn btn-outline !min-h-11 !px-4">Reset</a>
      </div>
    </form>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-6 flex w-full items-center justify-between border border-line px-4 py-3 text-xs uppercase tracking-[0.14em] lg:hidden"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /> Filter & sort</span>
        <span>{activeSize || activeColor ? "Active" : ""}</span>
      </button>

      <div className="hidden lg:block">
        <div className="sticky top-28">{panel}</div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-paper lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <p className="overline">Filter & sort</p>
            <button type="button" onClick={() => setOpen(false)} className="flex h-11 w-11 items-center justify-center" aria-label="Close filters">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="h-[calc(100%-65px)] overflow-y-auto p-5 pb-20">{panel}</div>
        </div>
      )}
    </>
  );
}
