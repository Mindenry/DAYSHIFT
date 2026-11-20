import { cookies } from "next/headers";
import { apiGet } from "./api";

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  kind: "customer" | "staff";
  staffRole?: string;
  permissions: string[];
  emailVerifiedAt: string | null;
  loyalty?: { pointsBalance: number; tier: string } | null;
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    const cookie = store.toString();
    if (!cookie.includes("ds_session=")) return null;
    return await apiGet<SessionUser>("/auth/me", { cookie, revalidate: 0 });
  } catch {
    return null;
  }
}

export async function getCookieHeader(): Promise<string> {
  const store = await cookies();
  return store.toString();
}
