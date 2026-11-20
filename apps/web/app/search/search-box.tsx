"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export function SearchBox({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const router = useRouter();
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (value.trim()) router.push(`/search?q=${encodeURIComponent(value.trim())}`);
      }}
      className="flex items-center gap-3 border-b border-ink py-3"
    >
      <Search className="h-5 w-5" />
      <label htmlFor="search-page-input" className="sr-only">Search products</label>
      <input
        id="search-page-input"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search products, categories or SKUs"
        className="min-h-11 w-full bg-transparent font-display text-xl outline-none placeholder:text-stone sm:text-2xl"
        autoComplete="off"
      />
      <button type="submit" className="overline min-h-11 px-1">Search</button>
    </form>
  );
}
