export type AuthKind = "customer" | "staff";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  kind: AuthKind;
  sessionId: string;
  staffRole?: string;
  permissions: string[];
  emailVerified: boolean;
}

export interface GuestContext {
  cartToken?: string;
}

export const SESSION_COOKIE = "ds_session";
export const CART_COOKIE = "ds_cart";
