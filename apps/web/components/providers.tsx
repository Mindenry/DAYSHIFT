"use client";

import { Toaster } from "sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#1a1917",
            color: "#f6f2e9",
            border: "none",
            borderRadius: 0,
            fontSize: 13,
          },
        }}
      />
    </>
  );
}
