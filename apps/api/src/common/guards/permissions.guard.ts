import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { PERMISSIONS_KEY } from "../decorators";
import { AppError } from "../app-error";

/** Enforces granular staff permissions declared with @RequirePermissions(). */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) {
      throw AppError.forbidden("This endpoint requires an explicit permission policy");
    }
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;
    if (!user || user.kind !== "staff") {
      throw AppError.forbidden("Staff access required");
    }
    const missing = required.filter((permission) => !user.permissions.includes(permission));
    if (missing.length) {
      throw AppError.forbidden(`Missing permission: ${missing.join(", ")}`);
    }
    return true;
  }
}
