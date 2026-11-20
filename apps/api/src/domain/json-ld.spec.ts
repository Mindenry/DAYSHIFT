import { serializeJsonLd } from "@dayshift/config";

describe("JSON-LD serialisation", () => {
  it("escapes closing script tags and HTML-significant characters", () => {
    const result = serializeJsonLd({
      name: "</script><script>window.__xss=1</script>",
      ampersand: "a & b",
    });
    expect(result).not.toContain("</script>");
    expect(result).toContain("\\u003c/script\\u003e");
    expect(result).toContain("a \\u0026 b");
  });

  it("preserves ordinary JSON content", () => {
    const result = serializeJsonLd({ name: "The Everyday Tee", price: "45.00" });
    expect(JSON.parse(result)).toEqual({ name: "The Everyday Tee", price: "45.00" });
  });
});
