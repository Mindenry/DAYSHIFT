const API = "http://localhost:4000/api/v1";
const WEB = "http://localhost:3000";

async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return (res.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
}

const customer = await login("customer@dayshift.example", "Customer1234!Pass");

const pages = [
  ["/", ""],
  ["/collections/new-arrivals", ""],
  ["/c/women", ""],
  ["/products/the-everyday-oversized-tee", ""],
  ["/products/relaxed-linen-shirt", ""],
  ["/cart", ""],
  ["/checkout", customer],
  ["/login", ""],
  ["/support", ""],
  ["/track", ""],
  ["/account", customer],
  ["/account/orders", customer],
  ["/account/loyalty", customer],
  ["/account/addresses", customer],
];

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");
}

const THAI = /[\u0E00-\u0E7F]+/g;
for (const [path, cookie] of pages) {
  const res = await fetch(`${WEB}${path}`, {
    headers: { cookie: `ds_locale=en${cookie ? `; ${cookie}` : ""}` },
  });
  const html = await res.text();
  const text = visibleText(html);
  const matches = [...new Set(text.match(THAI) ?? [])];
  console.log(`${res.status} ${path} thai=${matches.length}`, matches.slice(0, 12).join(" | "));
}
