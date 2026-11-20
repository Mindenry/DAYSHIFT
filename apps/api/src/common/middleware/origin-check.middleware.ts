import type { Request, Response, NextFunction } from "express";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Same-site cookies plus an Origin allow-list defend state-changing browser
 * requests against CSRF. Webhooks are server-to-server (no Origin) and are
 * additionally protected by HMAC signature verification.
 */
export function originCheckMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!MUTATING.has(req.method)) return next();
  const origin = req.header("origin");
  if (!origin) return next();
  const allowed = [
    process.env.APP_URL ?? "http://localhost:3000",
    process.env.ADMIN_URL ?? "http://localhost:3001",
  ];
  if (allowed.includes(origin)) return next();
  res.status(403).json({
    statusCode: 403,
    code: "ORIGIN_REJECTED",
    message: "Request origin is not allowed",
    requestId: req.requestId,
  });
}
