import { Injectable } from '@nestjs/common';

import { Issuer } from 'openid-client';
import passport from 'passport';

import {
  AuthException,
  AuthExceptionCode,
} from 'src/engine/core-modules/auth/auth.exception';
import { OpenidStrategy } from 'src/engine/core-modules/auth/strategies/openid.auth.strategy';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

// The openid-client strategy needs the issuer's discovery document, which is
// fetched asynchronously, so it cannot be built synchronously in the guard like
// the Google/Microsoft passport strategies. It is rediscovered and re-registered
// on the passport singleton per login: a fresh discovery keeps the issuer
// metadata and signing keys (JWKS) current, mirroring how the Google/Microsoft
// guards rebuild their strategy on every request. Caching the client instead
// would serve stale keys after the provider rotates them and fail token
// validation until the server restarts.
@Injectable()
export class OpenidAuthStrategyService {
  constructor(private readonly twentyConfigService: TwentyConfigService) {}

  async ensureStrategyRegistered(): Promise<void> {
    const issuerUrl = this.twentyConfigService.get('OPENID_ISSUER');
    const clientId = this.twentyConfigService.get('OPENID_CLIENT_ID');
    const callbackUrl = this.resolveCallbackUrl();

    const missing = [
      !issuerUrl && 'OPENID_ISSUER',
      !clientId && 'OPENID_CLIENT_ID',
      !callbackUrl && 'AUTH_OPENID_CALLBACK_URL or SERVER_URL',
    ].filter((value): value is string => typeof value === 'string');

    if (missing.length > 0 || !issuerUrl || !clientId || !callbackUrl) {
      throw new AuthException(
        `OpenID configuration is incomplete, missing: ${missing.join(', ')}`,
        AuthExceptionCode.INVALID_INPUT,
      );
    }

    const issuer = await Issuer.discover(issuerUrl);
    const client = new issuer.Client({
      client_id: clientId,
      redirect_uris: [callbackUrl],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
    });

    passport.use('openid', new OpenidStrategy(client, callbackUrl));
  }

  // The callback path is fixed by the controller route, so it only needs the
  // public server URL. AUTH_OPENID_CALLBACK_URL stays as an override for setups
  // whose external callback host differs from SERVER_URL (e.g. reverse proxies).
  private resolveCallbackUrl(): string | undefined {
    const explicitCallbackUrl = this.twentyConfigService.get(
      'AUTH_OPENID_CALLBACK_URL',
    );

    if (explicitCallbackUrl) {
      return explicitCallbackUrl;
    }

    const serverUrl = this.twentyConfigService.get('SERVER_URL');

    if (!serverUrl) {
      return undefined;
    }

    return `${serverUrl.replace(/\/+$/, '')}/auth/openid/redirect`;
  }
}
