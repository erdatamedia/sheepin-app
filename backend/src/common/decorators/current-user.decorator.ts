import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '@prisma/client';

type CurrentRequestUser = {
  id: string;
  email?: string | null;
  loginCode?: string | null;
  role: UserRole;
};

type RequestWithUser = {
  user?: CurrentRequestUser;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
