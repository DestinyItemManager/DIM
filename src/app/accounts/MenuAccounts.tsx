import React from 'react';
import { removeToken } from '../bungie-api/oauth-tokens';
import './Account.scss';
import { compareAccounts, DestinyAccount } from './destiny-account';
import { UISref } from '@uirouter/react';
import { router } from '../router';
import { AppIcon, signOutIcon } from '../shell/icons';
import { currentAccountSelector } from './reducer';
import { RootState } from '../store/reducers';
import { connect } from 'react-redux';
import Account from './Account';
import { t } from 'app/i18next-t';

interface ProvidedProps {
  closeDropdown(e: React.MouseEvent<HTMLDivElement>): void;
}

interface StoreProps {
  currentAccount?: DestinyAccount;
  accounts: readonly DestinyAccount[];
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    currentAccount: currentAccountSelector(state),
    accounts: state.accounts.accounts
  };
}

type Props = ProvidedProps & StoreProps;

function MenuAccounts({ currentAccount, closeDropdown, accounts }: Props) {
  if (!currentAccount) {
    return null;
  }

  const otherAccounts = accounts.filter((p) => !compareAccounts(p, currentAccount));

  const logOut = () => {
    removeToken();
    router.stateService.go('login', { reauth: true });
  };

  return (
    <div className="account-select">
      <h3>Accounts</h3>
      <Account className="selected-account" account={currentAccount} />
      {otherAccounts.map((account) => (
        <UISref
          key={`${account.membershipId}-${account.destinyVersion}`}
          to={account.destinyVersion === 1 ? 'destiny1' : 'destiny2'}
          params={account}
          onClick={closeDropdown}
        >
          <Account account={account} onClick={closeDropdown} />
        </UISref>
      ))}
      <div className="account log-out" onClick={logOut}>
        <AppIcon icon={signOutIcon} />
        &nbsp;
        {t('Settings.LogOut')}
      </div>
    </div>
  );
}

export default connect<StoreProps>(mapStateToProps)(MenuAccounts);
