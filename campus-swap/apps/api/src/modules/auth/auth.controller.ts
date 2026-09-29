import {
  refreshTokenSchema,
  requestCodeSchema,
  verifyCodeSchema,
  type AuthSession,
  type AuthTokens,
  type CurrentUser,
  type RefreshTokenInput,
  type RequestCodeInput,
  type RequestCodeResponse,
  type VerifyCodeInput,
} from '@campus-swap/shared';
import { Body, Controller, Get, HttpCode, Ip, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';

import {
  CurrentUser as CurrentUserParam,
  Public,
  type RequestUser,
} from '../../common/auth/auth.decorators';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /**
   * Always answers the same way for any valid .edu address at a known school,
   * so nobody can use it to find out who already has an account.
   */
  @Public()
  @Post('request-code')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async requestCode(
    @Body(new ZodValidationPipe(requestCodeSchema)) body: RequestCodeInput,
    @Ip() ip: string,
  ): Promise<RequestCodeResponse> {
    return this.auth.requestCode(body.email, ip || null);
  }

  @Public()
  @Post('verify-code')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async verifyCode(
    @Body(new ZodValidationPipe(verifyCodeSchema)) body: VerifyCodeInput,
    @Req() request: Request,
  ): Promise<AuthSession> {
    return this.auth.verifyCode({
      email: body.email,
      code: body.code,
      pushToken: body.pushToken,
      userAgent: request.get('user-agent'),
    });
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Body(new ZodValidationPipe(refreshTokenSchema)) body: RefreshTokenInput,
    @Req() request: Request,
  ): Promise<AuthTokens> {
    return this.auth.refresh(body.refreshToken, request.get('user-agent'));
  }

  @Public()
  @Post('sign-out')
  @HttpCode(204)
  async signOut(
    @Body(new ZodValidationPipe(refreshTokenSchema)) body: RefreshTokenInput,
  ): Promise<void> {
    await this.auth.signOut(body.refreshToken);
  }

  @Get('me')
  async me(@CurrentUserParam() user: RequestUser): Promise<CurrentUser> {
    return this.auth.me(user.id);
  }
}
