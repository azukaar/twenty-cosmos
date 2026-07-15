import { useParams, useSearchParams } from 'react-router-dom';

import { useAuth } from '@/auth/hooks/useAuth';
import { type BillingCheckoutSession } from '@/auth/types/billingCheckoutSession.type';
import { type SocialSSOSignInUpActionType } from '@/auth/types/socialSSOSignInUp.type';
import {
  BillingPlanKey,
  SubscriptionInterval,
} from '~/generated-metadata/graphql';

export const useSignInWithCosmos = () => {
  const workspaceInviteHash = useParams().workspaceInviteHash;
  const [searchParams] = useSearchParams();
  const workspacePersonalInviteToken =
    searchParams.get('inviteToken') ?? undefined;
  const billingCheckoutSession = {
    plan: BillingPlanKey.PRO,
    interval: SubscriptionInterval.Month,
    requirePaymentMethod: true,
  } as BillingCheckoutSession;

  const { signInWithCosmos } = useAuth();

  return {
    signInWithCosmos: ({ action }: { action: SocialSSOSignInUpActionType }) =>
      signInWithCosmos({
        workspaceInviteHash,
        workspacePersonalInviteToken,
        billingCheckoutSession,
        action,
      }),
  };
};
