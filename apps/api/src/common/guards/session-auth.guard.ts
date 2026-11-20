import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { IS_PUBLIC_KEY } from "../decorators";
import { AppError } from "../app-error";
import { AuthService } from "../../modules/auth/auth.service";
import { SESSION_COOKIE } from "../types";

/**
 * Resolves the session cookie for every request. Routes are protected by
 * default; only handlers explicitly marked @Public() allow anonymous access.
 */
@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const token = request.cookies?.[SESSION_COOKIE] as string | undefined;
    if (token) {
      const user = await this.authService.resolveSession(token);
      if (user) request.user = user;
    }

    if (!isPublic && !request.user) {
      throw AppError.unauthorized();
    }
    return true;
  }
}
