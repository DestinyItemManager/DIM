import React from 'react';
import './Account.scss';
import { DestinyAccount } from './destiny-account';
import { UISref } from '@uirouter/react';
import { AppIcon, signOutIcon } from '../shell/icons';
import { currentAccountSelector } from './reducer';
import { RootState, ThunkDispatchProp } from '../store/reducers';
import { connect } from 'react-redux';
import Account from './Account';
import { t } from 'app/i18next-t';
import _ from 'lodash';
import { logOut } from './platforms';

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

type Props = ProvidedProps & StoreProps & ThunkDispatchProp;

function MenuAccounts({ currentAccount, closeDropdown, accounts, dispatch }: Props) {
  if (!currentAccount) {
    return null;
  }

  const sortedAccounts = _.sortBy(accounts, (a) => -(a.lastPlayed?.getTime() || 0));

  return (
    <div className="account-select">
      <h3>Accounts</h3>
      {sortedAccounts.map((account) => (
        <UISref
          key={`${account.membershipId}-${account.destinyVersion}`}
          to={account.destinyVersion === 1 ? 'destiny1' : 'destiny2'}
          params={account}
        >
          <Account
            className={account === currentAccount ? 'selected-account' : ''}
            account={account}
            onClick={closeDropdown}
          />
        </UISref>
      ))}
      <div className="account log-out" onClick={() => dispatch(logOut())}>
        <AppIcon icon={signOutIcon} />
        &nbsp;
        {t('Settings.LogOut')}
      </div>
    </div>
  );
}

export default connect<StoreProps>(mapStateToProps)(MenuAccounts);
