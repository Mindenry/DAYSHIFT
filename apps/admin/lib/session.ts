import { cookies } from "next/headers";
import { apiGet } from "./api";

export interface StaffSession {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  kind: "customer" | "staff";
  staffRole?: string;
  permissions: string[];
}

export async function getStaffSession(): Promise<StaffSession | null> {
  try {
    const store = await cookies();
    const cookie = store.toString();
    if (!cookie.includes("ds_session=")) return null;
    const user = await apiGet<StaffSession>("/auth/me", { cookie });
    if (!user || user.kind !== "staff") return null;
    return user;
  } catch {
    return null;
  }
}

export async function getCookieHeader(): Promise<string> {
  const store = await cookies();
  return store.toString();
}

export async function requireStaff() {
  const session = await getStaffSession();
  return session;
}

export function can(session: StaffSession, permission: string) {
  return session.permissions.includes(permission);
}
