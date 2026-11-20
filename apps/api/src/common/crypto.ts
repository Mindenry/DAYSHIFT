import { createHmac } from "node:crypto";

export function randomToken(bytes = 32): string {
  return createHashLike(bytes);
}

function createHashLike(bytes: number): string {
   
  const { randomBytes } = require("node:crypto") as typeof import("node:crypto");
  return randomBytes(bytes).toString("base64url");
}

export function sha256(value: string): string {
   
  const { createHash } = require("node:crypto") as typeof import("node:crypto");
  return createHash("sha256").update(value).digest("hex");
}

export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function hmacSha256(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}
