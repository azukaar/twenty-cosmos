import { type IncomingMessage } from 'http';

import { type Request } from 'express';
import {
  type Client,
  Strategy,
  type TokenSet,
  type UserinfoResponse,
} from 'openid-client';
import { type APP_LOCALES } from 'twenty-shared/translations';
import { parseJson } from 'twenty-shared/utils';

import {
  AuthException,
  AuthExceptionCode,
} from 'src/engine/core-modules/auth/auth.exception';
import { type SocialSSOSignInUpActionType } from 'src/engine/core-modules/auth/types/signInUp.type';
import { type SocialSSOState } from 'src/engine/core-modules/auth/types/social-sso-state.type';

export type OpenidRequest = Omit<
  Request,
  'user' | 'workspace' | 'workspaceMetadataVersion'
> & {
  user: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    picture: string | null;
    locale?: keyof typeof APP_LOCALES | null;
    workspaceInviteHash?: string;
    workspaceId?: string;
    billingCheckoutSessionState?: string;
    action: SocialSSOSignInUpActionType;
    returnToPath?: string;
  };
};

const buildUserFromClaims = (
  userinfo: UserinfoResponse,
  state: SocialSSOState | undefined,
): OpenidRequest['user'] => {
  if (!userinfo.email) {
    throw new AuthException(
      'Email not found in OpenID claims',
      AuthExceptionCode.INVALID_INPUT,
    );
  }

  return {
    email: userinfo.email,
    firstName: userinfo.given_name ?? null,
    lastName: userinfo.family_name ?? null,
    picture: userinfo.picture ?? null,
    workspaceInviteHash: state?.workspaceInviteHash,
    workspaceId: state?.workspaceId,
    billingCheckoutSessionState: state?.billingCheckoutSessionState,
    locale: state?.locale,
    action: state?.action ?? 'list-available-workspaces',
    returnToPath: state?.returnToPath,
  };
};

// Public client: PKCE (S256) with no client secret, so token_endpoint_auth_method
// is 'none' on the discovered client. App-level context rides in the OAuth state
// param, mirroring the Google/Microsoft social strategies.
export class OpenidStrategy extends Strategy<OpenidRequest['user']> {
  constructor(client: Client, callbackUrl: string) {
    super(
      {
        client,
        params: { scope: 'openid email profile', redirect_uri: callbackUrl },
        usePKCE: true,
        passReqToCallback: true,
      },
      (
        req: IncomingMessage,
        _tokenset: TokenSet,
        userinfo: UserinfoResponse,
        done: (err: unknown, user?: OpenidRequest['user']) => void,
      ) => {
        try {
          const state = parseJson<SocialSSOState>(
            (req as OpenidRequest).query.state as string,
          );

          done(null, buildUserFromClaims(userinfo, state));
        } catch (error) {
          done(error);
        }
      },
    );
  }

  // oxlint-disable-next-line typescript/no-explicit-any
  authenticate(req: OpenidRequest, options: any) {
    return super.authenticate(req, {
      ...options,
      state: JSON.stringify({
        workspaceInviteHash: req.query.workspaceInviteHash,
        workspaceId: req.query.workspaceId ?? req.params.workspaceId,
        locale: req.query.locale,
        billingCheckoutSessionState: req.query.billingCheckoutSessionState,
        action: req.query.action,
        returnToPath: req.query.returnToPath,
      }),
    });
  }
}
