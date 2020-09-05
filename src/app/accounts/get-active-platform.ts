import store from '../store/store';
import { DestinyAccount } from './destiny-account';
import { currentAccountSelector } from './selectors';

// TODO: get rid of this - we don't want to implicitly depend on store
export function getActivePlatform(): DestinyAccount | undefined {
  return currentAccountSelector(store.getState());
}
