import React from 'react';
import './Account.scss';
import { DestinyAccount } from './destiny-account';
import { AppIcon, signOutIcon } from '../shell/icons';
import { currentAccountSelector } from './selectors';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import Account from './Account';
import { t } from 'app/i18next-t';
import _ from 'lodash';
import { logOut } from './platforms';
import { accountRoute } from 'app/routes';
import styles from './MenuAccounts.m.scss';
import clsx from 'clsx';

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
    accounts: state.accounts.accounts,
  };
}

type Props = ProvidedProps & StoreProps & ThunkDispatchProp;

function MenuAccounts({ currentAccount, closeDropdown, accounts, dispatch }: Props) {
  if (!currentAccount) {
    return null;
  }

  const sortedAccounts = _.sortBy(accounts, (a) => -(a.lastPlayed?.getTime() || 0));

  return (
    <div className={styles.accountSelect}>
      <h3>Accounts</h3>
      {sortedAccounts.map((account) => (
        <Link
          key={`${account.membershipId}-${account.destinyVersion}`}
          to={`${accountRoute(account)}/inventory`}
        >
          <Account
            className={account === currentAccount ? 'selected-account' : ''}
            account={account}
            onClick={closeDropdown}
          />
        </Link>
      ))}
      <div className={clsx('account', styles.logout)} onClick={() => dispatch(logOut())}>
        <AppIcon icon={signOutIcon} />
        &nbsp;
        {t('Settings.LogOut')}
      </div>
    </div>
  );
}

export default connect<StoreProps>(mapStateToProps)(MenuAccounts);
