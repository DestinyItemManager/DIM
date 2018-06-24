import { getPlatforms, getActivePlatform } from '../accounts/platform.service';
import { ReactStateDeclaration } from '@uirouter/react';

/**
 * A config function that will create the default account route, which is used to redirect
 * when we don't know what to do.
 */
export const defaultAccountRoute: ReactStateDeclaration = {
  name: 'default-account',
  async redirectTo() {
    await getPlatforms();
    const activeAccount = getActivePlatform();
    if (activeAccount) {
      return {
        state: `destiny${activeAccount.destinyVersion}.inventory`,
        params: activeAccount
      };
    }
  }
};
