/**
 * Cookies are `Secure` whenever the deployment serves HTTPS. Plain-HTTP LAN
 * demos must opt out explicitly with COOKIE_SECURE=false; production should
 * leave the variable unset (or set it to true) so the flag is never lost by
 * accident.
 */
export function secureCookies(): boolean {
  const explicit = process.env.COOKIE_SECURE;
  if (explicit !== undefined) return explicit === "true";
  return process.env.NODE_ENV === "production";
}
