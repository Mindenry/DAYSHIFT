import { SetMetadata, createParamDecorator, ExecutionContext } from "@nestjs/common";

export const IS_PUBLIC_KEY = "dayshift:isPublic";
export const PERMISSIONS_KEY = "dayshift:permissions";

/** Marks a route as accessible without a session. Staff routes must never be public. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Requires the authenticated staff member to hold every listed permission. */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});

export const RequestId = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.requestId;
});
