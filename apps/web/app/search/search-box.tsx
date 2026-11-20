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
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search products, categories or SKUs"
        className="w-full bg-transparent font-display text-2xl outline-none placeholder:text-stone"
      />
      <button type="submit" className="overline">Search</button>
    </form>
  );
}
