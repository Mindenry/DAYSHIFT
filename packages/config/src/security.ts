/**
 * Serialises structured data for a JSON-LD script tag. Escaping HTML
 * significant characters prevents `</script>` inside product data from
 * breaking out of the tag (stored XSS).
 */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
