import { getPlatforms } from '../accounts/platforms';
import { ReactStateDeclaration } from '@uirouter/react';
import store from 'app/store/store';
import { currentAccountSelector } from 'app/accounts/reducer';

/**
 * A config function that will create the default account route, which is used to redirect
 * when we don't know what to do.
 */
export const defaultAccountRoute: ReactStateDeclaration = {
  name: 'default-account',
  async redirectTo() {
    await store.dispatch(getPlatforms());
    const activeAccount = currentAccountSelector(store.getState());
    if (activeAccount) {
      return {
        state: `destiny${activeAccount.destinyVersion}.inventory`,
        params: activeAccount
      };
    }
  }
};
