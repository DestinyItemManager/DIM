import { getPlatforms } from '../accounts/platforms';
import { ReactStateDeclaration } from '@uirouter/react';
import store from 'app/store/store';
import { currentAccountSelector } from 'app/accounts/reducer';
import DefaultAccount from './DefaultAccount';

/**
 * A config function that will create the default account route, which is used to redirect
 * when we don't know what to do.
 */
export const defaultAccountRoute: ReactStateDeclaration = {
  name: 'default-account',
  component: DefaultAccount,
  async redirectTo() {
    await ((store.dispatch(getPlatforms()) as any) as Promise<any>);
    const activeAccount = currentAccountSelector(store.getState());
    if (activeAccount) {
      return {
        state: `destiny${activeAccount.destinyVersion}.inventory`,
        params: activeAccount
      };
    }
  }
};
