import styled from '@emotion/styled';
import { useLingui } from '@lingui/react/macro';
import { memo, useContext } from 'react';
import { IconSparkles } from 'twenty-ui/icon';
import { MainButton } from 'twenty-ui/input';
import { HorizontalSeparator } from 'twenty-ui/layout';
import { ThemeContext } from 'twenty-ui/theme-constants';

import { useHasMultipleAuthMethods } from '@/auth/sign-in-up/hooks/useHasMultipleAuthMethods';
import { useSignInWithCosmos } from '@/auth/sign-in-up/hooks/useSignInWithCosmos';
import { lastAuthenticatedMethodState } from '@/auth/states/lastAuthenticatedMethodState';
import {
  SignInUpStep,
  signInUpStepState,
} from '@/auth/states/signInUpStepState';
import { AuthenticatedMethod } from '@/auth/types/AuthenticatedMethod.enum';
import { type SocialSSOSignInUpActionType } from '@/auth/types/socialSSOSignInUp.type';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

import { LastUsedPill } from './LastUsedPill';
import { StyledSSOButtonContainer } from './SignInUpSSOButtonStyles';

const CosmosIcon = memo(() => {
  const { theme } = useContext(ThemeContext);

  return <IconSparkles size={theme.icon.size.md} color="#fff" />;
});

const StyledCosmosButton = styled(MainButton)`
  background: linear-gradient(90deg, #ff64c8 0%, #c864ff 100%);
  border-color: transparent;
  color: #fff;

  &:hover {
    background: linear-gradient(90deg, #ff4fbf 0%, #bf4fff 100%);
  }
`;

export const SignInUpWithCosmos = ({
  action,
  isGlobalScope,
}: {
  action: SocialSSOSignInUpActionType;
  isGlobalScope?: boolean;
}) => {
  const { t } = useLingui();
  const signInUpStep = useAtomStateValue(signInUpStepState);
  const [lastAuthenticatedMethod, setLastAuthenticatedMethod] = useAtomState(
    lastAuthenticatedMethodState,
  );
  const { signInWithCosmos } = useSignInWithCosmos();
  const hasMultipleAuthMethods = useHasMultipleAuthMethods();

  const handleClick = () => {
    setLastAuthenticatedMethod(AuthenticatedMethod.COSMOS);
    signInWithCosmos({ action });
  };

  const isLastUsed = lastAuthenticatedMethod === AuthenticatedMethod.COSMOS;

  return (
    <>
      <StyledSSOButtonContainer>
        <StyledCosmosButton
          Icon={CosmosIcon}
          title={t`Login with Cosmos`}
          onClick={handleClick}
          fullWidth
        />
        {isLastUsed && (isGlobalScope || hasMultipleAuthMethods) && (
          <LastUsedPill />
        )}
      </StyledSSOButtonContainer>
      <HorizontalSeparator visible={false} />
    </>
  );
};
