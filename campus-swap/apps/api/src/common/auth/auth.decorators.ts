import { SetMetadata, createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { UserRole } from '@campus-swap/shared';
import type { Request } from 'express';

/** What the JWT guard attaches to the request once a token checks out. */
export interface RequestUser {
  id: string;
  schoolId: string;
  role: UserRole;
  sessionId: string;
}

export interface AuthenticatedRequest extends Request {
  user?: RequestUser;
}

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

/** Opts a route out of the global JWT guard. Used by /health and /v1/auth/*. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  return request.user;
});
