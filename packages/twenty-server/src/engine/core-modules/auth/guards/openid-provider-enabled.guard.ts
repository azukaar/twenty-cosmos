import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';

import {
  AuthException,
  AuthExceptionCode,
} from 'src/engine/core-modules/auth/auth.exception';
import { OpenidAuthStrategyService } from 'src/engine/core-modules/auth/services/openid-auth-strategy.service';
import { GuardRedirectService } from 'src/engine/core-modules/guard-redirect/services/guard-redirect.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

@Injectable()
export class OpenidProviderEnabledGuard implements CanActivate {
  constructor(
    private readonly twentyConfigService: TwentyConfigService,
    private readonly guardRedirectService: GuardRedirectService,
    private readonly openidAuthStrategyService: OpenidAuthStrategyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      if (!this.twentyConfigService.get('AUTH_OPENID_ENABLED')) {
        throw new AuthException(
          'OpenID auth is not enabled',
          AuthExceptionCode.OAUTH_ACCESS_DENIED,
        );
      }

      await this.openidAuthStrategyService.ensureStrategyRegistered();

      return true;
    } catch (err) {
      this.guardRedirectService.dispatchErrorFromGuard(
        context,
        err,
        this.guardRedirectService.getSubdomainAndCustomDomainFromContext(
          context,
        ),
      );

      return false;
    }
  }
}
