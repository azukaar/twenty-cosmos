import {
  Controller,
  Get,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { Response } from 'express';

import { AuthOAuthExceptionFilter } from 'src/engine/core-modules/auth/filters/auth-oauth-exception.filter';
import { AuthRestApiExceptionFilter } from 'src/engine/core-modules/auth/filters/auth-rest-api-exception.filter';
import { OpenidOauthGuard } from 'src/engine/core-modules/auth/guards/openid-oauth.guard';
import { OpenidProviderEnabledGuard } from 'src/engine/core-modules/auth/guards/openid-provider-enabled.guard';
import { AuthService } from 'src/engine/core-modules/auth/services/auth.service';
import { OpenidRequest } from 'src/engine/core-modules/auth/strategies/openid.auth.strategy';
import { AuthProviderEnum } from 'src/engine/core-modules/workspace/types/workspace.type';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';

@Controller('auth/openid')
@UseFilters(AuthRestApiExceptionFilter)
export class OpenidAuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @UseGuards(
    OpenidProviderEnabledGuard,
    OpenidOauthGuard,
    PublicEndpointGuard,
    NoPermissionGuard,
  )
  async openidAuth() {
    // Protected by the OpenID guard, which triggers the OIDC authorization flow
    return;
  }

  @Get('redirect')
  @UseGuards(
    OpenidProviderEnabledGuard,
    OpenidOauthGuard,
    PublicEndpointGuard,
    NoPermissionGuard,
  )
  @UseFilters(AuthOAuthExceptionFilter)
  async openidAuthRedirect(@Req() req: OpenidRequest, @Res() res: Response) {
    return res.redirect(
      await this.authService.signInUpWithSocialSSO(
        req.user,
        AuthProviderEnum.OpenId,
      ),
    );
  }
}
